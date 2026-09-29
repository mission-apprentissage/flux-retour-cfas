import type { IUsersMigration } from "shared/models";

import { buildUser, jour, type SeedContext } from "../factories";
import { seedId } from "../seed-ids";

export const USERS = {
  ML_A_CONSEIL_1: 1,
  ML_A_CONSEIL_2: 2,
} as const;

export const userId = (code: keyof typeof USERS) => seedId("user", USERS[code]);

export function buildUtilisateurs(ctx: SeedContext): IUsersMigration[] {
  const mlA = ctx.missionsLocales.ML_A._id;
  return [
    buildUser(ctx, {
      n: USERS.ML_A_CONSEIL_1,
      organisationId: mlA,
      prenom: "Inès",
      nom: "Conseil ML A",
      fonction: "Conseillère en insertion",
      lastConnection: jour(ctx, -1),
    }),
    buildUser(ctx, {
      n: USERS.ML_A_CONSEIL_2,
      organisationId: mlA,
      prenom: "Hugo",
      nom: "Conseil ML A",
      fonction: "Conseiller en insertion",
      lastConnection: jour(ctx, -3),
    }),
  ];
}
