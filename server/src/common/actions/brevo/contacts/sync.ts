import { promises as fs } from "node:fs";

import { ObjectId } from "bson";

import logger from "@/common/logger";
import {
  BrevoContact,
  ensureBrevoAttributes,
  importContactsToBrevoList,
  serializeBrevoAttributes,
} from "@/common/services/brevo/brevo";

import { getOrCreateContactList } from "./list.actions";
import { getContactList } from "./registry";
import { isBrevoInstantSyncActive, isBrevoMlGenericContactsActive } from "./sync-settings.actions";
import { FetchContactsFilter } from "./types";

// Sample affiché dans l'UI admin : on applique la même sérialisation que celle
// envoyée à Brevo (dates en `yyyy-MM-dd`, `undefined` filtré) pour que l'aperçu
// reflète exactement le payload final.
const serializeSample = (contacts: BrevoContact[]) =>
  contacts.slice(0, 10).map((c) => ({
    email: c.email,
    attributes: serializeBrevoAttributes(c.attributes),
  }));

export const previewContactList = async (params: { slug: string }) => {
  const contactList = getContactList(params.slug);

  const contacts = await contactList.fetchContacts();

  return {
    count: contacts.length,
    sample: serializeSample(contacts),
    listName: contactList.buildListName(),
  };
};

/**
 * Upsert pur côté Brevo : on N'APPELLE PAS `removeAllContactFromList` pour ne
 * pas dégager les contacts hors-périmètre TBA (imports manuels, autres sources)
 * ni les attributs gérés manuellement (`cfa_erp_client`).
 *
 * - `dryRun: true` : exécute le pipeline d'agrégation et le mapping mais
 *   n'appelle pas Brevo. Les invitations de connexion sont quand même
 *   créées/rafraîchies en DB (les tokens vivent en DB, pas dans des emails déjà envoyés).
 * - `dumpTo: <path>` : écrit le payload complet en JSON pour inspection.
 */
export const syncContactList = async (params: {
  slug: string;
  dryRun?: boolean;
  dumpTo?: string;
  // Restreint la synchro à ces utilisateurs / organisations (synchro unitaire).
  // Absent → full.
  filter?: FetchContactsFilter;
}) => {
  const contactList = getContactList(params.slug);

  const hasFilter = Boolean(params.filter?.userIds?.length || params.filter?.organisationIds?.length);
  const contacts = await contactList.fetchContacts(hasFilter ? params.filter : undefined);
  const listName = contactList.buildListName();

  if (params.dumpTo) {
    await fs.writeFile(params.dumpTo, JSON.stringify({ listName, count: contacts.length, contacts }, null, 2), "utf8");
  }

  if (params.dryRun) {
    return {
      dryRun: true as const,
      listName,
      count: contacts.length,
      sample: serializeSample(contacts),
    };
  }

  // Sans cet appel, les attributs déclarés mais inexistants côté Brevo seraient
  // droppés silencieusement à l'import.
  const attributesReport = await ensureBrevoAttributes(contactList.attributesSchema);

  const listId = await getOrCreateContactList({
    slug: contactList.slug,
    name: listName,
    folderId: contactList.brevoFolderId,
    listId: contactList.brevoListId,
  });

  const importResults = await importContactsToBrevoList(listId, contacts);

  const failedBatches = importResults.filter((r) => r === undefined).length;

  return {
    dryRun: false as const,
    listId,
    listName,
    count: contacts.length,
    batches: importResults.length,
    failedBatches,
    attributes: attributesReport,
  };
};

/**
 * Synchro Brevo d'UN SEUL utilisateur (réutilise tout le pipeline `tba-contacts`).
 * No-op silencieux si l'utilisateur n'est pas dans le périmètre (statut/orga non
 * éligibles, `unsubscribe:true`) : le `$match` en amont renvoie 0 contact et
 * `importContactsToBrevoList([])` ne fait rien.
 */
export const syncSingleContact = async (userId: ObjectId | string) => {
  if (!(await isBrevoInstantSyncActive())) {
    logger.info({ userId: String(userId) }, "Brevo single contact sync skipped (inactif ou hors production)");
    return;
  }
  const _id = typeof userId === "string" ? new ObjectId(userId) : userId;
  return await syncContactList({ slug: "tba-contacts", filter: { userIds: [_id] } });
};

/**
 * Synchro Brevo du SEUL contact dérivé d'une organisation (adresse générique
 * d'une Mission Locale). No-op si la synchro instantanée ou les contacts
 * génériques ML sont désactivés.
 */
export const syncSingleOrganisationContact = async (organisationId: ObjectId | string) => {
  if (!(await isBrevoInstantSyncActive()) || !(await isBrevoMlGenericContactsActive())) {
    logger.info(
      { organisationId: String(organisationId) },
      "Brevo single organisation contact sync skipped (inactif ou hors production)"
    );
    return;
  }
  const _id = typeof organisationId === "string" ? new ObjectId(organisationId) : organisationId;
  return await syncContactList({ slug: "tba-contacts", filter: { organisationIds: [_id] } });
};
