import { ObjectId } from "bson";

import { BrevoContact } from "@/common/services/brevo/brevo";

/**
 * Filtre optionnel passé à `fetchContacts`. Sans filtre → synchro full
 * (comportement historique). Avec `userIds` → synchro ciblée (unitaire),
 * pour la synchro instantanée d'un compte. Avec `organisationIds` → synchro
 * ciblée des contacts dérivés d'organisations (adresses génériques ML).
 *
 * Règle, valable pour toutes les sources d'une liste : une source ne répond
 * qu'aux clés qui la concernent, et ne renvoie rien si le filtre ne porte que
 * des clés étrangères. Sans quoi une synchro unitaire d'utilisateur
 * embarquerait au passage l'intégralité des contacts d'organisation.
 */
export type FetchContactsFilter = { userIds?: ObjectId[]; organisationIds?: ObjectId[] };

export type ContactListUtm = {
  source: string;
  medium: string;
  campaign?: string;
  content?: string;
};

export type BrevoAttributeType = "text" | "float" | "boolean" | "date";

export type ContactListAttributesSchema = Record<string, BrevoAttributeType>;

export interface ContactListDefinition {
  slug: string;
  label: string;
  description: string;
  brevoFolderId: number;
  /**
   * Si fourni, la sync écrit dans cette liste Brevo existante (typiquement
   * référencée par `MNA_TDB_BREVO_LIST_ID_*`). Sinon, la liste est créée
   * automatiquement à la 1ʳᵉ sync via `getOrCreateContactList`.
   */
  brevoListId?: number;
  buildListName: () => string;
  attributesSchema: ContactListAttributesSchema;
  fetchContacts: (filter?: FetchContactsFilter) => Promise<BrevoContact[]>;
}
