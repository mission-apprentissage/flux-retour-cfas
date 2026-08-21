import { ACC_CONJOINT_MOTIF_ENUM, IEffectifMissionLocale } from "shared";
import {
  CFA_RISQUE_RUPTURE_ENUM,
  CFA_SITUATION_TYPE_ENUM,
  RQTH_DECLARE_ENUM,
} from "shared/models/data/missionLocaleEffectif.model";

import { VerifiedInfo } from "./hooks";

export type FormValues = {
  situation_type: CFA_SITUATION_TYPE_ENUM | null;
  risque_rupture: CFA_RISQUE_RUPTURE_ENUM | null;
  still_at_cfa: boolean | null;
  date_rupture: string;
  date_abandon: string;
  date_debut_formation: string;
  recherche_entreprise: string;
  motifs: ACC_CONJOINT_MOTIF_ENUM[];
  commentaires_par_motif: Partial<Record<ACC_CONJOINT_MOTIF_ENUM, string>>;
  cause_rupture: string;
  referent_type: "me" | "other" | null;
  referent_details: string;
  verified_info: VerifiedInfo;
  rqth_declare: RQTH_DECLARE_ENUM;
  responsable_legal: { nom: string; telephone: string; courriel: string };
  note_complementaire: string;
  feedback_note: number | null;
  feedback_remarque: string;
};

export type VerifiedField = {
  key: keyof VerifiedInfo;
  label: string;
  required: boolean;
  isAddress?: boolean;
};

export type MlOrg = NonNullable<IEffectifMissionLocale["effectif"]["mission_locale_organisation"]>;
