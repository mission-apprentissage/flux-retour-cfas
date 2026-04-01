import { z } from "zod";

export const zDeclareCfaRuptureApi = z.object({
  date_rupture: z
    .string()
    .datetime()
    .refine((val) => new Date(val) <= new Date(), { message: "La date de rupture ne peut pas être dans le futur" }),
  source: z.enum(["effectifs", "effectifsDECA"]),
});

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

export interface ICfaRupturesResponse {
  segments: ICfaRuptureSegment[];
  isAllowedDeca: boolean;
}

export type CfaEffectifSource = "effectifs" | "effectifsDECA";

export interface ICfaEffectif {
  id: string;
  source: CfaEffectifSource;
  nom: string;
  prenom: string;
  en_rupture: boolean;
  is_plus_25: boolean;
  date_rupture: string | null;
  libelle_formation: string;
  formation_niveau_libelle: string | null;
  collab_status: CfaCollaborationStatus | null;
  has_unread_notification: boolean;
}

export interface ICfaEffectifsResponse {
  effectifs: ICfaEffectif[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    formations: string[];
  };
  isAllowedDeca: boolean;
}
