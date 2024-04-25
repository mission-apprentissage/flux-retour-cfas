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
