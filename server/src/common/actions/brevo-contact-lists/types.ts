import { BrevoContact } from "@/common/services/brevo/brevo";

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
  buildListName: (ctx: { env: string }) => string;
  attributesSchema: ContactListAttributesSchema;
  fetchContacts: () => Promise<BrevoContact[]>;
}
