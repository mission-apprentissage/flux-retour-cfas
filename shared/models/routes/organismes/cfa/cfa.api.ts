import { z } from "zod";

export const zDeclareCfaRuptureApi = z.object({
  date_rupture: z
    .string()
    .datetime()
    .refine((val) => new Date(val) <= new Date(), { message: "La date de rupture ne peut pas être dans le futur" })
    .refine(
      (val) => {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        return new Date(val) >= oneYearAgo;
      },
      { message: "La date de rupture ne peut pas être antérieure à plus d'un an" }
    ),
  source: z.enum(["effectifs", "effectifsDECA"]),
});

export const CFA_COLLAB_STATUS = {
  DEMARRER_COLLAB: "demarrer_collab",
  COLLAB_DEMANDEE: "collab_demandee",
  CONTACTE_PAR_ML_HORS_COLLAB: "contacte_par_ml_hors_collab",
  TRAITE_PAR_ML: "traite_par_ml",
} as const;

export type CfaCollaborationStatus = (typeof CFA_COLLAB_STATUS)[keyof typeof CFA_COLLAB_STATUS];

export interface ICfaRuptureEffectif {
  id: string;
  nom: string;
  prenom: string;
  date_rupture: string;
  jours_depuis_rupture: number;
  // true si le dossier est transmis automatiquement à la ML (rupture >= 45j) -> section "+45j après rupture".
  is_transmis_auto: boolean;
  libelle_formation: string;
  formation_niveau_libelle: string | null;
  collab_status: CfaCollaborationStatus;
  has_unread_notification: boolean;
}

export interface ICfaRupturesResponse {
  effectifs: ICfaRuptureEffectif[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  counts: {
    moins_45j: number;
    plus_45j: number;
  };
  filters: {
    formations: string[];
  };
  isAllowedDeca: boolean;
}

// --- Suivi Missions Locales (3 sous-onglets) ---

export const CFA_SUIVI_CATEGORY = {
  COLLAB: "collab",
  HORS_COLLAB: "hors_collab",
  TOUS: "tous",
} as const;

export type CfaSuiviCategory = (typeof CFA_SUIVI_CATEGORY)[keyof typeof CFA_SUIVI_CATEGORY];

export interface ICfaSuiviMissionLocaleResponse {
  effectifs: ICfaEffectif[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  counts: {
    collab: number;
    hors_collab: number;
    tous: number;
  };
  filters: {
    formations: string[];
  };
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
  is_moins_16: boolean;
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
