export const CFA_COLLAB_STATUS = {
  DEMARRER_COLLAB: "demarrer_collab",
  COLLAB_DEMANDEE: "collab_demandee",
  CONTACTE_PAR_ML: "contacte_par_ml",
  TRAITE_PAR_ML: "traite_par_ml",
} as const;

export type CfaCollaborationStatus = (typeof CFA_COLLAB_STATUS)[keyof typeof CFA_COLLAB_STATUS];

export interface ICfaRuptureEffectif {
  id: string;
  nom: string;
  prenom: string;
  date_rupture: string;
  jours_depuis_rupture: number;
  libelle_formation: string;
  formation_niveau_libelle: string | null;
  collab_status: CfaCollaborationStatus;
  has_unread_notification: boolean;
}

export type CfaRuptureSegmentKey = "moins_45j" | "46_90j" | "91_180j";

export interface ICfaRuptureSegment {
  segment: CfaRuptureSegmentKey;
  count: number;
  effectifs: ICfaRuptureEffectif[];
}

export type ICfaRupturesResponse = ICfaRuptureSegment[];
