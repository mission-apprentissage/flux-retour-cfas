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
};

export const ORGANISATIONS_NATIONALES = [
  {
    nom: "Services de la Première ministre",
    key: "Services de la Première ministre",
  },
  {
    nom: "Ministère de l'Agriculture et de la Souveraineté alimentaire",
    key: "Ministère de l'Agriculture et de la Souveraineté alimentaire",
  },
  {
    nom: "Ministère des Armées",
    key: "Ministère des Armées",
  },
  {
    nom: "Ministère de la Culture",
    key: "Ministère de la Culture",
  },
  {
    nom: "Ministère de l'Économie, des Finances et de la Souveraineté industrielle et numérique",
    key: "Ministère de l'Économie, des Finances et de la Souveraineté industrielle et numérique",
  },
  {
    nom: "Ministère de l'Éducation nationale et de la Jeunesse",
    key: "Ministère de l'Éducation nationale et de la Jeunesse",
  },
  {
    nom: "Ministère de l'Enseignement supérieur et de la Recherche",
    key: "Ministère de l'Enseignement supérieur et de la Recherche",
  },
  {
    nom: "Ministère de l'Europe et des Affaires étrangères",
    key: "Ministère de l'Europe et des Affaires étrangères",
  },
  {
    nom: "Ministère de l'Intérieur et des Outre-mer",
    key: "Ministère de l'Intérieur et des Outre-mer",
  },
  {
    nom: "Ministère de la Justice",
    key: "Ministère de la Justice",
  },
  {
    nom: "Ministère de la Santé et de la Prévention",
    key: "Ministère de la Santé et de la Prévention",
  },
  {
    nom: "Ministère des Solidarités, de l'Autonomie et des Personnes handicapées",
    key: "Ministère des Solidarités, de l'Autonomie et des Personnes handicapées",
  },
  {
    nom: "Ministère des Sports et des Jeux Olympiques et Paralympiques",
    key: "Ministère des Sports et des Jeux Olympiques et Paralympiques",
  },
  {
    nom: "Ministère de la Transformation et de la Fonction publiques",
    key: "Ministère de la Transformation et de la Fonction publiques",
  },
  {
    nom: "Ministère de la Transition écologique et de la Cohésion des territoires",
    key: "Ministère de la Transition écologique et de la Cohésion des territoires",
  },
  {
    nom: "Ministère de la Transition énergétique",
    key: "Ministère de la Transition énergétique",
  },
  {
    nom: "Ministère du Travail, du Plein emploi et de l'Insertion",
    key: "Ministère du Travail, du Plein emploi et de l'Insertion",
  },
] as const;

export type OrganisationsNationalesKey = (typeof ORGANISATIONS_NATIONALES)[number]["key"];

export const ORGANISATIONS_NATIONALES_SORTED_BY_NAME = sortAlphabeticallyBy("nom", ORGANISATIONS_NATIONALES);
