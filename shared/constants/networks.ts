import { sortAlphabeticallyBy } from "../utils/sortAlphabetically";

/**
 * Noms des réseaux de CFAS
 */
export const TETE_DE_RESEAUX = [
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
    nom: "EDUSERVICE", // Réseau Education Nationale
    key: "EDUSERVICE",
    responsable: false,
  },
] as const satisfies ReadonlyArray<{ readonly nom: string; readonly key: string; readonly responsable: boolean }>;

export const TETE_DE_RESEAU_ = [];

export type ITetesDeReseaux = typeof TETE_DE_RESEAUX;
export type ITeteDeReseau = ITetesDeReseaux[number];
export type ITeteDeReseauKey = ITeteDeReseau["key"];

export type TeteDeReseauKey = (typeof TETE_DE_RESEAUX)[number]["key"];

export const TETE_DE_RESEAUX_SORTED = sortAlphabeticallyBy("nom", TETE_DE_RESEAUX);

export const TETE_DE_RESEAUX_BY_ID = TETE_DE_RESEAUX.reduce(
  (acc, reseau) => {
    acc[reseau.key] = reseau;
    return acc;
  },
  {} as Record<ITeteDeReseauKey, ITeteDeReseau>
);

export function isTeteDeReseauResponsable(key: ITeteDeReseauKey): boolean {
  return TETE_DE_RESEAUX_BY_ID[key].responsable;
}
