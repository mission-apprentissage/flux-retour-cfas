export const STATUT_APPRENANT = {
  ABANDON: "ABANDON",
  PRE_INSCRIT: "PRE_INSCRIT",
  INSCRIT: "INSCRIT",
  APPRENTI: "APPRENTI",
  RUPTURANT: "RUPTURANT",
  FIN_DE_FORMATION: "FIN_DE_FORMATION",
} as const;

export type StatutApprenant = (typeof STATUT_APPRENANT)[keyof typeof STATUT_APPRENANT];

export const STATUT_APPRENANT_VALUES = Object.values(STATUT_APPRENANT);

const STATUT_NAME: { [key in StatutApprenant]: string } = {
  ABANDON: "Abandon",
  PRE_INSCRIT: "Pré-inscrit",
  INSCRIT: "Sans contrat",
  APPRENTI: "Apprenti",
  RUPTURANT: "Rupturant",
  FIN_DE_FORMATION: "Fin de formation",
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
export const MOTIF_SUPPRESSION_LABEL = [
  {
    id: MOTIF_SUPPRESSION.MauvaiseManip,
    label: "J’ai fait une mauvaise manipulation",
  },
  {
    id: MOTIF_SUPPRESSION.RetourScolaire,
    label: "L’apprenant a changé d’avis et est de retour en voie scolaire",
  },
  {
    id: MOTIF_SUPPRESSION.ChangementCfa,
    label: "L’apprenant a changé d’avis et est parti dans un autre organisme de formation",
  },
  {
    id: MOTIF_SUPPRESSION.RefusCandidature,
    label: "Refus de candidature",
  },
  {
    id: MOTIF_SUPPRESSION.Doublon,
    label: "Cet apprenant apparaît en double",
  },
  {
    id: MOTIF_SUPPRESSION.Autre,
    label: "Autre raison",
  },
];
