import { sortAlphabeticallyBy } from "../utils/sortAlphabetically";

/**
 * Noms des réseaux de CFAS
 */
export const TETE_DE_RESEAUX = sortAlphabeticallyBy("nom", [
  {
    nom: "ADEN",
    key: "ADEN",
  },
  {
    nom: "CMA",
    key: "CMA",
  },
  {
    nom: "AGRI",
    key: "AGRI",
  },
  {
    nom: "ANASUP",
    key: "ANASUP",
  },
  {
    nom: "CCI",
    key: "CCI",
  },
  {
    nom: "EXCELLENCE PRO",
    key: "CFA_EC",
  },
  {
    nom: "COMPAGNONS DU DEVOIR",
    key: "COMP_DU_DEVOIR",
  },
  {
    nom: "GRETA",
    key: "GRETA",
  },
  {
    nom: "UIMM",
    key: "UIMM",
  },
  {
    nom: "BTP CFA",
    key: "BTP_CFA",
  },
  {
    nom: "MFR",
    key: "MFR",
  },
  {
    nom: "AFTRAL",
    key: "AFTRAL",
  },
  {
    nom: "GRETA VAUCLUSE",
    key: "GRETA_VAUCLUSE",
  },
  {
    nom: "CFA SAT",
    key: "CFA_SAT",
  },
] as const);

export const TETE_DE_RESEAUX_BY_ID = TETE_DE_RESEAUX.reduce((acc, reseau) => {
  acc[reseau.key] = reseau;
  return acc;
}, {});
