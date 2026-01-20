import { z } from "zod";

export const STATUT_APPRENANT = {
  ABANDON: "ABANDON",
  PRE_INSCRIT: "PRE_INSCRIT",
  INSCRIT: "INSCRIT",
  APPRENTI: "APPRENTI",
  RUPTURANT: "RUPTURANT",
  FIN_DE_FORMATION: "FIN_DE_FORMATION",
  INTER_CONTRAT: "INTER_CONTRAT",
} as const;

export type StatutApprenant = (typeof STATUT_APPRENANT)[keyof typeof STATUT_APPRENANT];

export const STATUT_APPRENANT_VALUES = Object.values(STATUT_APPRENANT);

export const STATUT_NAME: { [key in StatutApprenant]: string } = {
  ABANDON: "Abandon",
  PRE_INSCRIT: "Pré-inscrit",
  INSCRIT: "Inscrit sans contrat",
  APPRENTI: "Apprenti",
  RUPTURANT: "Rupture de contrat",
  FIN_DE_FORMATION: "Fin de formation",
  INTER_CONTRAT: "Intercontrat",
};

export function getStatut(statut: StatutApprenant): string {
  return STATUT_NAME[statut] || "NC";
}

export interface Statut {
  en_cours: string;
  parcours: ParcoursStatut[];
}

interface ParcoursStatut {
  valeur: StatutApprenant;
  date: Date;
}

export enum MOTIF_SUPPRESSION {
  MauvaiseManip = "MAUVAISE_MANIP",
  RetourScolaire = "RETOUR_SCOLAIRE",
  ChangementCfa = "CHANGEMENT_CFA",
  RefusCandidature = "REFUS_CANDIDATURE",
  Autre = "AUTRE",
  Doublon = "DOUBLON",
}

export const SOURCE_APPRENANT = {
  FICHIER: "FICHIER",
  ERP: "ERP",
  DECA: "DECA",
} as const;

export type SourceApprenant = (typeof SOURCE_APPRENANT)[keyof typeof SOURCE_APPRENANT];

const SOURCE_APPRENANT_VALUES = Object.values(SOURCE_APPRENANT) as [string, ...string[]];

export const SourceApprenantEnum = z.enum(SOURCE_APPRENANT_VALUES);
