import Boom from "boom";
import express from "express";
import { z } from "zod";

import { listContactLists } from "@/common/actions/brevo/contacts/registry";
import { previewContactList, syncContactList } from "@/common/actions/brevo/contacts/sync";
import { brevoContactListDb } from "@/common/model/collections";
import { returnResult } from "@/http/middlewares/helpers";

const syncBodySchema = z.object({
  dryRun: z.boolean().default(false),
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

  return router;
};
