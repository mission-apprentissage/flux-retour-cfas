import { promises as fs } from "node:fs";

import {
  BrevoContact,
  ensureBrevoAttributes,
  importContactsToBrevoList,
  serializeBrevoAttributes,
} from "@/common/services/brevo/brevo";
import config from "@/config";

import { getOrCreateContactList } from "./list.actions";
import { getContactList } from "./registry";

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
    listName: contactList.buildListName({ env: config.env }),
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
export const syncContactList = async (params: { slug: string; dryRun?: boolean; dumpTo?: string }) => {
  const contactList = getContactList(params.slug);

  const contacts = await contactList.fetchContacts();
  const listName = contactList.buildListName({ env: config.env });

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
