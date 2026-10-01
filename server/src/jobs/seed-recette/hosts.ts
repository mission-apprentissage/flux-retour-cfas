import { ObjectId } from "mongodb";

export const CFA_HOST_CODES = [
  "CFA_ON",
  "CFA_SUSP",
  "CFA_OFF",
  "CFA_SANS",
  "CFA_DECA",
  "CFA_REAL_CAMPUS",
  "CFA_AFTRAL",
] as const;
export type CfaHostCode = (typeof CFA_HOST_CODES)[number];

export const ML_HOST_CODES = ["ML_A", "ML_B", "ML_CLICHY"] as const;
export type MlHostCode = (typeof ML_HOST_CODES)[number];

const HOTES_AVEC_ACTIVITE: ReadonlyArray<MlHostCode | CfaHostCode> = ["ML_CLICHY", "CFA_REAL_CAMPUS", "CFA_AFTRAL"];
const sansActivite = <T extends MlHostCode | CfaHostCode>(codes: readonly T[]) =>
  codes.filter((code) => !HOTES_AVEC_ACTIVITE.includes(code));
const ML_HOST_CODES_SANS_ACTIVITE = sansActivite(ML_HOST_CODES);
export const CFA_HOST_CODES_SANS_ACTIVITE = sansActivite(CFA_HOST_CODES);

export interface CfaHost {
  organisationId: ObjectId;
  organismeId: ObjectId;
}

export interface SeedRecetteHosts {
  missionsLocales: Record<MlHostCode, ObjectId>;
  cfas: Record<CfaHostCode, CfaHost>;
  auteurClichy?: ObjectId;
}

export const HOSTS_RECETTE: SeedRecetteHosts = {
  missionsLocales: {
    ML_A: new ObjectId("679b92f1bdd1dd56b488014e"),
    ML_B: new ObjectId("67b59632ba5ecb4ba6caaaec"),
    ML_CLICHY: new ObjectId("67b59632ba5ecb4ba6caab32"),
  },
  cfas: {
    CFA_ON: {
      organisationId: new ObjectId("693e1c17ae4afef0564640f1"),
      organismeId: new ObjectId("693e1bf1ae4afef0564623c9"),
    },
    CFA_SUSP: {
      organisationId: new ObjectId("693e1c07ae4afef056463b30"),
      organismeId: new ObjectId("693e1bebae4afef0564616ec"),
    },
    CFA_OFF: {
      organisationId: new ObjectId("693e1c20ae4afef056464464"),
      organismeId: new ObjectId("693e1bf7ae4afef056463365"),
    },
    CFA_SANS: {
      organisationId: new ObjectId("693e1c18ae4afef056464133"),
      organismeId: new ObjectId("693e1bf1ae4afef056462477"),
    },
    CFA_DECA: {
      organisationId: new ObjectId("693e1c21ae4afef056464503"),
      organismeId: new ObjectId("693e1bf8ae4afef056463612"),
    },
    CFA_REAL_CAMPUS: {
      organisationId: new ObjectId("68e683565ad4d7d7e66e53d0"),
      organismeId: new ObjectId("635ad3e95e798f12bd91d252"),
    },
    CFA_AFTRAL: {
      organisationId: new ObjectId("68e6835b5ad4d7d7e66e554b"),
      organismeId: new ObjectId("635ad53b5e798f12bd91e091"),
    },
  },
  auteurClichy: new ObjectId("6ab28996f43326c464083e89"),
};

export interface SeedCommune {
  code_postal: string;
  code_insee: string;
  commune: string;
  departement: string;
  region: string;
}

export const ML_HOST_COMMUNES: Record<MlHostCode, SeedCommune[]> = {
  ML_A: [
    { code_postal: "94200", code_insee: "94041", commune: "Ivry-sur-Seine", departement: "94", region: "11" },
    { code_postal: "94400", code_insee: "94081", commune: "Vitry-sur-Seine", departement: "94", region: "11" },
  ],
  ML_B: [{ code_postal: "93300", code_insee: "93001", commune: "Aubervilliers", departement: "93", region: "11" }],
  ML_CLICHY: [{ code_postal: "92110", code_insee: "92024", commune: "Clichy", departement: "92", region: "11" }],
};

export const mlOrganisationIds = (hosts: SeedRecetteHosts) => Object.values(hosts.missionsLocales);
export const cfaOrganisationIds = (hosts: SeedRecetteHosts) => Object.values(hosts.cfas).map((c) => c.organisationId);
export const cfaOrganismeIds = (hosts: SeedRecetteHosts) => Object.values(hosts.cfas).map((c) => c.organismeId);

export const mlOrganisationIdsSansActivite = (hosts: SeedRecetteHosts) =>
  ML_HOST_CODES_SANS_ACTIVITE.map((code) => hosts.missionsLocales[code]);
export const cfaOrganismeIdsSansActivite = (hosts: SeedRecetteHosts) =>
  CFA_HOST_CODES_SANS_ACTIVITE.map((code) => hosts.cfas[code].organismeId);

export const HOST_LABELS: Record<MlHostCode | CfaHostCode, { nom: string; role: string }> = {
  ML_A: { nom: "Mission Locale Ivry-Vitry-sur-Seine (ml_id 569)", role: "ML activée par le seed, avec lien de RDV" },
  ML_B: { nom: "Mission Locale d'Aubervilliers (ml_id 39)", role: "ML non activée" },
  ML_CLICHY: {
    nom: "Clichoise pour l'insertion sociale et professionnelle des jeunes, Clichy (ml_id 139)",
    role: "ML réelle déjà activée, avec ses propres dossiers ; flags jamais modifiés",
  },
  CFA_ON: { nom: "ESTP, Cachan", role: "Collaboration active" },
  CFA_SUSP: { nom: "Association Sup de Vinci, Saint-Maur-des-Fossés", role: "Collaboration suspendue pour inactivité" },
  CFA_OFF: { nom: "Maison du Sacré-Cœur, Thiais", role: "Utilise le TDB, sans collaboration" },
  CFA_SANS: { nom: "AFASEC Grosbois, Boissy-Saint-Léger", role: "Sans compte TDB" },
  CFA_DECA: { nom: "Plateform', Montreuil", role: "Pilote DECA et collaboration active" },
  CFA_REAL_CAMPUS: { nom: "Real Campus by L'Oréal, Clichy", role: "CFA réel sans collaboration, à inviter" },
  CFA_AFTRAL: { nom: "AFTRAL, Gennevilliers", role: "CFA réel, collaboration activée à J-7" },
};
