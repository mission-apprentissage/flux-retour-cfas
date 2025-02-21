import { addJob } from "job-processor";

import { reseauxDb } from "@/common/model/collections";

const TETE_DE_RESEAUX = [
  {
    nom: "ADEN",
    key: "ADEN",
    responsable: false,
  },
  {
    nom: "CMA",
    key: "CMA",
    responsable: false,
  },
  {
    nom: "AGRI",
    key: "AGRI",
    responsable: false,
  },
  {
    nom: "AGRI_CNEAP",
    key: "AGRI_CNEAP",
    responsable: false,
  },
  {
    nom: "AGRI_UNREP",
    key: "AGRI_UNREP",
    responsable: false,
  },
  {
    nom: "AGRI_UNMFREO",
    key: "AGRI_UNMFREO",
    responsable: false,
  },
  {
    nom: "ANASUP",
    key: "ANASUP",
    responsable: false,
  },
  {
    nom: "AMUE",
    key: "AMUE",
    responsable: false,
  },
  {
    nom: "CCI",
    key: "CCI",
    responsable: false,
  },
  {
    nom: "EXCELLENCE PRO",
    key: "CFA_EC",
    responsable: false,
  },
  {
    nom: "COMPAGNONS DU DEVOIR",
    key: "COMP_DU_DEVOIR",
    responsable: true,
  },
  {
    nom: "COMPAGNONS DU TOUR DE FRANCE",
    key: "COMP_DU_TOUR_DE_FRANCE",
    responsable: false,
  },
  {
    nom: "GRETA",
    key: "GRETA",
    responsable: false,
  },
  {
    nom: "UIMM",
    key: "UIMM",
    responsable: false,
  },
  {
    nom: "BTP CFA",
    key: "BTP_CFA",
    responsable: false,
  },
  {
    nom: "MFR",
    key: "MFR",
    responsable: false,
  },
  {
    nom: "AFTRAL",
    key: "AFTRAL",
    responsable: true,
  },
  {
    nom: "GRETA VAUCLUSE",
    key: "GRETA_VAUCLUSE",
    responsable: false,
  },
  {
    nom: "CFA SAT",
    key: "CFA_SAT",
    responsable: false,
  },
  {
    nom: "EN HORS MURS", // Réseau Education Nationale
    key: "EN_HORS_MURS",
    responsable: false,
  },
  {
    nom: "EN CFA ACADEMIQUE", // Réseau Education Nationale
    key: "EN_CFA_ACADEMIQUE",
    responsable: false,
  },
  {
    nom: "EN EPLE", // Réseau Education Nationale
    key: "EN_EPLE",
    responsable: false,
  },
  {
    nom: "EDUSERVICES",
    key: "EDUSERVICES",
    responsable: false,
  },
  {
    nom: "AFPA",
    key: "AFPA",
    responsable: true,
  },
] as const satisfies ReadonlyArray<{ readonly nom: string; readonly key: string; readonly responsable: boolean }>;

export const up = async () => {
  for (const reseau of TETE_DE_RESEAUX) {
    await reseauxDb().updateOne(
      {
        key: reseau.key,
      },
      {
        $set: {
          ...reseau,
          created_at: new Date(),
          updated_at: new Date(),
          organismes_ids: [],
        },
      },
      {
        upsert: true,
      }
    );
  }
  await addJob({
    name: "populate:reseaux",
    queued: true,
  });
};
