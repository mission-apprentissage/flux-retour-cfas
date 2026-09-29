import type { IUsersMigration } from "shared/models";

import { buildUser, jour, type SeedContext } from "../factories";
import { seedId } from "../seed-ids";

export const USERS = {
  ML_A_CONSEIL_1: 1,
  ML_A_CONSEIL_2: 2,
  CFA_ON_ADMIN: 11,
  CFA_ON_MEMBRE: 12,
  CFA_SUSP_ADMIN: 13,
  CFA_OFF_ADMIN: 14,
  CFA_DECA_ADMIN: 15,
} as const;

export const userId = (code: keyof typeof USERS) => seedId("user", USERS[code]);

export function buildUtilisateurs(ctx: SeedContext): IUsersMigration[] {
  const mlA = ctx.missionsLocales.ML_A._id;
  const cfa = (code: keyof SeedContext["cfas"]) => ctx.cfas[code].organisation._id;
  return [
    buildUser(ctx, {
      n: USERS.ML_A_CONSEIL_1,
      organisationId: mlA,
      prenom: "Claire",
      nom: "Fontaine",
      civility: "Madame",
      fonction: "Conseillère en insertion",
      lastConnection: jour(ctx, -1),
    }),
    buildUser(ctx, {
      n: USERS.ML_A_CONSEIL_2,
      organisationId: mlA,
      prenom: "Karim",
      nom: "Benali",
      civility: "Monsieur",
      fonction: "Conseiller en insertion",
      lastConnection: jour(ctx, -3),
    }),
    buildUser(ctx, {
      n: USERS.CFA_ON_ADMIN,
      organisationId: cfa("CFA_ON"),
      prenom: "Sophie",
      nom: "Marchand",
      civility: "Madame",
      fonction: "Référente apprentissage",
      role: "admin",
      lastConnection: jour(ctx, -1),
    }),
    buildUser(ctx, {
      n: USERS.CFA_ON_MEMBRE,
      organisationId: cfa("CFA_ON"),
      prenom: "Julien",
      nom: "Carpentier",
      civility: "Monsieur",
      fonction: "Chargé de relations entreprises",
      role: "member",
      lastConnection: jour(ctx, -6),
    }),
    buildUser(ctx, {
      n: USERS.CFA_SUSP_ADMIN,
      organisationId: cfa("CFA_SUSP"),
      prenom: "Nadia",
      nom: "Haddad",
      civility: "Madame",
      fonction: "Directrice adjointe",
      role: "admin",
      lastConnection: jour(ctx, -70),
    }),
    buildUser(ctx, {
      n: USERS.CFA_OFF_ADMIN,
      organisationId: cfa("CFA_OFF"),
      prenom: "Pierre",
      nom: "Lemoine",
      civility: "Monsieur",
      fonction: "Responsable administratif",
      role: "admin",
      lastConnection: jour(ctx, -12),
    }),
    buildUser(ctx, {
      n: USERS.CFA_DECA_ADMIN,
      organisationId: cfa("CFA_DECA"),
      prenom: "Aurélie",
      nom: "Chevalier",
      civility: "Madame",
      fonction: "Coordinatrice pédagogique",
      role: "admin",
      lastConnection: jour(ctx, -2),
    }),
  ];
}
