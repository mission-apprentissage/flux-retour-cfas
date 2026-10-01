import type { IUsersMigration } from "shared/models";

import { buildUser, jour, type SeedContext } from "../factories";
import { type CfaHostCode, ML_HOST_CODES, type MlHostCode } from "../hosts";
import { seedId } from "../seed-ids";

export interface Compte {
  n: number;
  hote: MlHostCode | CfaHostCode;
  prenom: string;
  nom: string;
  email?: string;
  civility: "Madame" | "Monsieur";
  fonction: string;
  role?: "admin" | "member";
  derniereConnexion?: number;
}

export const COMPTES = {
  ML_A_CONSEIL_1: {
    n: 1,
    hote: "ML_A",
    prenom: "Claire",
    nom: "Fontaine",
    civility: "Madame",
    fonction: "Conseillère en insertion",
    derniereConnexion: -1,
  },
  ML_A_CONSEIL_2: {
    n: 2,
    hote: "ML_A",
    prenom: "Karim",
    nom: "Benali",
    civility: "Monsieur",
    fonction: "Conseiller en insertion",
    derniereConnexion: -3,
  },
  ML_CLICHY_CONSEIL: {
    n: 103,
    hote: "ML_CLICHY",
    prenom: "Élodie",
    nom: "Marchetti",
    civility: "Madame",
    fonction: "Conseillère en insertion",
    derniereConnexion: -1,
  },
  CFA_ON_ADMIN: {
    n: 11,
    hote: "CFA_ON",
    prenom: "Sophie",
    nom: "Marchand",
    civility: "Madame",
    fonction: "Référente apprentissage",
    role: "admin",
    derniereConnexion: -1,
  },
  CFA_ON_MEMBRE: {
    n: 12,
    hote: "CFA_ON",
    prenom: "Julien",
    nom: "Carpentier",
    civility: "Monsieur",
    fonction: "Chargé de relations entreprises",
    role: "member",
    derniereConnexion: -6,
  },
  CFA_SUSP_ADMIN: {
    n: 13,
    hote: "CFA_SUSP",
    prenom: "Nadia",
    nom: "Haddad",
    civility: "Madame",
    fonction: "Directrice adjointe",
    role: "admin",
    derniereConnexion: -70,
  },
  CFA_OFF_ADMIN: {
    n: 14,
    hote: "CFA_OFF",
    prenom: "Pierre",
    nom: "Lemoine",
    civility: "Monsieur",
    fonction: "Responsable administratif",
    role: "admin",
    derniereConnexion: -12,
  },
  CFA_DECA_ADMIN: {
    n: 15,
    hote: "CFA_DECA",
    prenom: "Aurélie",
    nom: "Chevalier",
    civility: "Madame",
    fonction: "Coordinatrice pédagogique",
    role: "admin",
    derniereConnexion: -2,
  },
  CFA_REAL_CAMPUS_ADMIN: {
    n: 101,
    hote: "CFA_REAL_CAMPUS",
    prenom: "Karim",
    nom: "BENALI",
    email: "karim.benali@cfa-metiers-clichy.example",
    civility: "Monsieur",
    fonction: "Référent apprentissage",
    role: "admin",
  },
  CFA_AFTRAL_ADMIN: {
    n: 102,
    hote: "CFA_AFTRAL",
    prenom: "Sophie",
    nom: "LAURENT",
    email: "sophie.laurent@campus92-formation.example",
    civility: "Madame",
    fonction: "Chargée de suivi des apprentis",
    role: "admin",
  },
} satisfies Record<string, Compte>;

export type CodeCompte = keyof typeof COMPTES;

export const userId = (code: CodeCompte) => seedId("user", COMPTES[code].n);

const estMl = (hote: Compte["hote"]): hote is MlHostCode => (ML_HOST_CODES as readonly string[]).includes(hote);

const organisationDe = (ctx: SeedContext, hote: Compte["hote"]) =>
  estMl(hote) ? ctx.missionsLocales[hote]._id : ctx.cfas[hote].organisation._id;

export function buildUtilisateurs(ctx: SeedContext): IUsersMigration[] {
  return Object.values(COMPTES).map((compte: Compte) =>
    buildUser(ctx, {
      n: compte.n,
      organisationId: organisationDe(ctx, compte.hote),
      prenom: compte.prenom,
      nom: compte.nom,
      email: compte.email,
      civility: compte.civility,
      fonction: compte.fonction,
      role: compte.role,
      lastConnection: compte.derniereConnexion !== undefined ? jour(ctx, compte.derniereConnexion) : undefined,
    })
  );
}
