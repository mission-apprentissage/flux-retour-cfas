import { ObjectId } from "mongodb";

export const CFA_HOST_CODES = ["CFA_ON", "CFA_SUSP", "CFA_OFF", "CFA_SANS", "CFA_DECA"] as const;
export type CfaHostCode = (typeof CFA_HOST_CODES)[number];

export const ML_HOST_CODES = ["ML_A", "ML_B"] as const;
export type MlHostCode = (typeof ML_HOST_CODES)[number];

export interface CfaHost {
  organisationId: ObjectId;
  organismeId: ObjectId;
}

export interface SeedRecetteHosts {
  missionsLocales: Record<MlHostCode, ObjectId>;
  cfas: Record<CfaHostCode, CfaHost>;
}

export const HOSTS_RECETTE: SeedRecetteHosts = {
  missionsLocales: {
    ML_A: new ObjectId("679b92f1bdd1dd56b488014e"),
    ML_B: new ObjectId("67b59632ba5ecb4ba6caaaec"),
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
  },
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
};

export const mlOrganisationIds = (hosts: SeedRecetteHosts) => Object.values(hosts.missionsLocales);
export const cfaOrganisationIds = (hosts: SeedRecetteHosts) => Object.values(hosts.cfas).map((c) => c.organisationId);
export const cfaOrganismeIds = (hosts: SeedRecetteHosts) => Object.values(hosts.cfas).map((c) => c.organismeId);
