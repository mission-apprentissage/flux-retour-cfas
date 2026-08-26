import type { ML_SITUATION_DOSSIER } from "shared/constants";

export type EffectifData = {
  id: string;
  nom: string;
  prenom: string;
  libelle_formation: string;
  commune?: string | null;
  code_postal?: string | null;
  organisme_nom: string;
  organisme_raison_sociale: string;
  organisme_enseigne: string;
  prioritaire: boolean;
  a_contacter: boolean;
  mineur: boolean;
  acc_conjoint: boolean;
  rqth: boolean;
  a_traiter: boolean;
  injoignable?: boolean;
  nouveau_contrat: boolean;
  unread_by_current_user?: boolean;
  whatsapp_callback_requested?: boolean;
  whatsapp_no_help_responded?: boolean;
  souhaite_rdv?: boolean;
  souhaite_rdv_at?: string | null;
  // Dates de suivi du dossier (sous-texte daté sous le badge de statut)
  date_reception?: string | null;
  date_traitement?: string | null;
  date_dernier_passage_a_recontacter?: string | null;
  date_derniere_action_ml?: string | null;
};

export type EffectifPriorityData = EffectifData & {
  date_rupture: string;
};

/** Ligne des listes « Dossiers prioritaires » et « Collaborations CFA ». */
export type MlListeEffectif = EffectifData & {
  injoignable: boolean;
  situation_dossier: ML_SITUATION_DOSSIER;
  relance_urgente: boolean;
  date_rupture?: string | null;
};

export type MlListeResponse = {
  effectifs: MlListeEffectif[];
  counts: { a_traiter_ou_recontacter: number; traite: number };
};

export type MonthItem = {
  month: string;
  data: EffectifData[];
  treated_count?: number;
};

export type SelectedSection = "a-traiter" | "deja-traite" | "injoignable" | "prioritaire";

export type MonthsData = {
  a_traiter: MonthItem[];
  prioritaire: { hadEffectifsPrioritaires: boolean; effectifs: EffectifData[] };
  injoignable_prioritaire: { hadEffectifsPrioritaires: boolean; effectifs: EffectifData[] };
  traite: MonthItem[];
  injoignable: MonthItem[];
  a_traiter_ou_recontacter: MonthItem[];
};
