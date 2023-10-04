// données à synchroniser avec /server/src/common/constants/networks.ts
// en attendant un import partagé

import { sortAlphabeticallyBy } from "@/common/utils/sortAlphabetically";

/**
 * Noms des réseaux de CFAS
 */
export const TETE_DE_RESEAUX = [
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
    nom: "AGRI_CNEAP",
    key: "AGRI_CNEAP",
  },
  {
    nom: "AGRI_UNREP",
    key: "AGRI_UNREP",
  },
  {
    nom: "AGRI_UNMFREO",
    key: "AGRI_UNMFREO",
  },
  {
    nom: "ANASUP",
    key: "ANASUP",
  },
  {
    nom: "AMUE",
    key: "AMUE",
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
    nom: "COMPAGNONS DU TOUR DE FRANCE",
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
  {
    nom: "EN HORS MURS", // Réseau Education Nationale
    key: "EN_HORS_MURS",
  },
  {
    nom: "EN CFA ACADEMIQUE", // Réseau Education Nationale
    key: "EN_CFA_ACADEMIQUE",
  },
  {
    nom: "EN EPLE", // Réseau Education Nationale
    key: "EN_EPLE",
  },
] as const;

export type TeteDeReseauKey = (typeof TETE_DE_RESEAUX)[number]["key"];

export const TETE_DE_RESEAUX_SORTED = sortAlphabeticallyBy("nom", TETE_DE_RESEAUX);

export const TETE_DE_RESEAUX_BY_ID = TETE_DE_RESEAUX.reduce((acc, reseau) => {
  acc[reseau.key] = reseau;
  return acc;
}, {});
