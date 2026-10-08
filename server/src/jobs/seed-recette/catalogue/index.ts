import type { SeedContext } from "../factories";

import { COLLAB_CASES, EFFECTIFS_CASES, INVITATION_CASES } from "./cfa";
import { CLICHY_CASES } from "./clichy";
import { ML_CASES } from "./ml";
import { emptyDocs, mergeDocs, type SeedCase, type SeedDocs } from "./types";
import { buildUtilisateurs } from "./utilisateurs";
import { WHATSAPP_CASES } from "./whatsapp";

export const CATALOGUE: SeedCase[] = [
  ...ML_CASES,
  ...WHATSAPP_CASES,
  ...COLLAB_CASES,
  ...EFFECTIFS_CASES,
  ...INVITATION_CASES,
  ...CLICHY_CASES,
];

export async function buildCatalogue(ctx: SeedContext): Promise<SeedDocs> {
  const docs = emptyDocs();
  docs.users.push(...buildUtilisateurs(ctx));
  for (const seedCase of CATALOGUE) {
    mergeDocs(docs, await seedCase.build(ctx));
  }
  return docs;
}
