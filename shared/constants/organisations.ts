import { sortAlphabeticallyBy } from "../utils";

export const ORGANISATION_TYPE = {
  ORGANISME_FORMATION: "ORGANISME_FORMATION",
  TETE_DE_RESEAU: "TETE_DE_RESEAU",
  DREETS: "DREETS",
  DRAAF: "DRAAF",
  CONSEIL_REGIONAL: "CONSEIL_REGIONAL",
  CARIF_OREF_REGIONAL: "CARIF_OREF_REGIONAL",
  DRAFPIC: "DRAFPIC",
  DDETS: "DDETS",
  ACADEMIE: "ACADEMIE",
  OPERATEUR_PUBLIC_NATIONAL: "OPERATEUR_PUBLIC_NATIONAL",
  CARIF_OREF_NATIONAL: "CARIF_OREF_NATIONAL",
  ADMINISTRATEUR: "ADMINISTRATEUR",
  MISSION_LOCALE: "MISSION_LOCALE",
  ARML: "ARML",
};

export const ORGANISATIONS_NATIONALES_MAP = {
  PREMIER_MINISTRE: "Services de la Première ministre",
  AGRICULTURE: "Ministère de l'Agriculture et de la Souveraineté alimentaire",
  ARMEES: "Ministère des Armées",
  CULTURE: "Ministère de la Culture",
  ECONOMIE: "Ministère de l'Économie, des Finances et de la Souveraineté industrielle et numérique",
  EDUC_NATIONALE: "Ministère de l'Éducation nationale et de la Jeunesse",
  ENSEIGNEMENT_SUP: "Ministère de l'Enseignement supérieur et de la Recherche",
  ETRANGERE: "Ministère de l'Europe et des Affaires étrangères",
  INTERIEUR: "Ministère de l'Intérieur et des Outre-mer",
  JUSTICE: "Ministère de la Justice",
  SANTE: "Ministère de la Santé et de la Prévention",
  SOLIDARITE: "Ministère des Solidarités, de l'Autonomie et des Personnes handicapées",
  SPORTS: "Ministère des Sports et des Jeux Olympiques et Paralympiques",
  PUBLIQUE: "Ministère de la Transformation et de la Fonction publiques",
  TRANSITITION_ECOLO: "Ministère de la Transition écologique et de la Cohésion des territoires",
  ENERGIE: "Ministère de la Transition énergétique",
  TRAVAIL: "Ministère du Travail, du Plein emploi et de l'Insertion",
};

export const ORGANISATIONS_NATIONALES = [
  {
    nom: "Services de la Première ministre",
    key: ORGANISATIONS_NATIONALES_MAP.PREMIER_MINISTRE,
  },
  {
    nom: "Ministère de l'Agriculture et de la Souveraineté alimentaire",
    key: ORGANISATIONS_NATIONALES_MAP.AGRICULTURE,
  },
  {
    nom: "Ministère des Armées",
    key: ORGANISATIONS_NATIONALES_MAP.ARMEES,
  },
  {
    nom: "Ministère de la Culture",
    key: ORGANISATIONS_NATIONALES_MAP.CULTURE,
  },
  {
    nom: "Ministère de l'Économie, des Finances et de la Souveraineté industrielle et numérique",
    key: ORGANISATIONS_NATIONALES_MAP.ECONOMIE,
  },
  {
    nom: "Ministère de l'Éducation nationale et de la Jeunesse",
    key: ORGANISATIONS_NATIONALES_MAP.EDUC_NATIONALE,
  },
  {
    nom: "Ministère de l'Enseignement supérieur et de la Recherche",
    key: ORGANISATIONS_NATIONALES_MAP.ENSEIGNEMENT_SUP,
  },
  {
    nom: "Ministère de l'Europe et des Affaires étrangères",
    key: ORGANISATIONS_NATIONALES_MAP.ETRANGERE,
  },
  {
    nom: "Ministère de l'Intérieur et des Outre-mer",
    key: ORGANISATIONS_NATIONALES_MAP.INTERIEUR,
  },
  {
    nom: "Ministère de la Justice",
    key: ORGANISATIONS_NATIONALES_MAP.JUSTICE,
  },
  {
    nom: "Ministère de la Santé et de la Prévention",
    key: ORGANISATIONS_NATIONALES_MAP.SANTE,
  },
  {
    nom: "Ministère des Solidarités, de l'Autonomie et des Personnes handicapées",
    key: ORGANISATIONS_NATIONALES_MAP.SOLIDARITE,
  },
  {
    nom: "Ministère des Sports et des Jeux Olympiques et Paralympiques",
    key: ORGANISATIONS_NATIONALES_MAP.SPORTS,
  },
  {
    nom: "Ministère de la Transformation et de la Fonction publiques",
    key: ORGANISATIONS_NATIONALES_MAP.PUBLIQUE,
  },
  {
    nom: "Ministère de la Transition écologique et de la Cohésion des territoires",
    key: ORGANISATIONS_NATIONALES_MAP.TRANSITITION_ECOLO,
  },
  {
    nom: "Ministère de la Transition énergétique",
    key: ORGANISATIONS_NATIONALES_MAP.ENERGIE,
  },
  {
    nom: "Ministère du Travail, du Plein emploi et de l'Insertion",
    key: ORGANISATIONS_NATIONALES_MAP.TRAVAIL,
  },
] as const;

export type OrganisationsNationalesKey = (typeof ORGANISATIONS_NATIONALES)[number]["key"];

export const ORGANISATIONS_NATIONALES_SORTED_BY_NAME = sortAlphabeticallyBy("nom", ORGANISATIONS_NATIONALES);
