import Boom from "boom";
import express from "express";
import { z } from "zod";

import { getContactList, listContactLists } from "@/common/actions/brevo/contacts/registry";
import { previewContactList, syncContactList } from "@/common/actions/brevo/contacts/sync";
import { getBrevoSyncSettings, setBrevoSyncSetting } from "@/common/actions/brevo/contacts/sync-settings.actions";
import { brevoContactListDb } from "@/common/model/collections";
import { checkBrevoHealth, serializeBrevoAttributes } from "@/common/services/brevo/brevo";
import { returnResult } from "@/http/middlewares/helpers";

const syncBodySchema = z.object({
  dryRun: z.boolean().default(false),
});

const syncSettingsBodySchema = z.object({
  field: z.enum(["dailyFullSyncEnabled", "instantSyncEnabled"]),
  enabled: z.boolean(),
});

const ensureContactListExists = (slug: string) => {
  if (!listContactLists().some((cl) => cl.slug === slug)) {
    throw Boom.notFound(`Contact list not found: ${slug}`);
  }
};

export default () => {
  const router = express.Router();

  router.get(
    "/",
    returnResult(async () => {
      return listContactLists().map((cl) => ({
        slug: cl.slug,
        label: cl.label,
        description: cl.description,
      }));
    })
  );

  router.get(
    "/health",
    returnResult(async () => {
      return await checkBrevoHealth();
    })
  );

  // Pilotage des synchros Brevo (toggles persistés, activables en prod uniquement
  // — la garde est dans `setBrevoSyncSetting`).
  router.get(
    "/sync-settings",
    returnResult(async () => {
      return await getBrevoSyncSettings();
    })
  );

  router.put(
    "/sync-settings",
    returnResult(async (req) => {
      const { field, enabled } = syncSettingsBodySchema.parse(req.body ?? {});
      return await setBrevoSyncSetting(field, enabled, req.user.email);
    })
  );

  router.post(
    "/:slug/preview",
    returnResult(async (req) => {
      const { slug } = req.params;
      ensureContactListExists(slug);
      return await previewContactList({ slug });
    })
  );

  router.post(
    "/:slug/sync",
    returnResult(async (req) => {
      const { slug } = req.params;
      ensureContactListExists(slug);
      const { dryRun } = syncBodySchema.parse(req.body ?? {});
      return await syncContactList({ slug, dryRun });
    })
  );

  router.get(
    "/:slug/list",
    returnResult(async (req) => {
      const { slug } = req.params;
      ensureContactListExists(slug);
      const list = await brevoContactListDb().findOne({ slug });
      if (!list) return null;
      return { listId: list.listId, listName: list.listName, updated_at: list.updated_at };
    })
  );

  // Export complet (vs `/preview` qui ne ramène que 10 samples). Réutilise
  // `fetchContacts` du contact list, applique la même sérialisation que la sync
  // (dates yyyy-MM-dd, `undefined` filtré) pour que l'Excel reflète exactement
  // le payload qui partirait à Brevo.
  //
  // POST car `fetchContacts` mute les invitations en DB
  // (`getOrCreateConnexionInvitationsByEmails`), cohérent avec `/preview` et `/sync`.
  router.post(
    "/:slug/export",
    returnResult(async (req) => {
      const { slug } = req.params;
      ensureContactListExists(slug);
      const contactList = getContactList(slug);
      const contacts = await contactList.fetchContacts();
      return {
        attributes: Object.keys(contactList.attributesSchema),
        contacts: contacts.map((c) => ({
          email: c.email,
          attributes: serializeBrevoAttributes(c.attributes),
        })),
      };
    })
  );

  return router;
};
