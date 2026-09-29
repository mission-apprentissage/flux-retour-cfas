import type { SeedContext } from "../factories";

import { ML_CASES } from "./ml";
import { emptyDocs, mergeDocs, type SeedCase, type SeedDocs } from "./types";
import { buildUtilisateurs } from "./utilisateurs";

export const CATALOGUE: SeedCase[] = [...ML_CASES];

export async function buildCatalogue(ctx: SeedContext): Promise<SeedDocs> {
  const docs = emptyDocs();
  docs.users.push(...buildUtilisateurs(ctx));
  for (const seedCase of CATALOGUE) {
    mergeDocs(docs, await seedCase.build(ctx));
  }
  return docs;
}
