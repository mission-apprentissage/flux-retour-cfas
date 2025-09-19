export type EffectifData = {
  id: string;
  nom: string;
  prenom: string;
  libelle_formation: string;
  organisme_nom: string;
  organisme_raison_sociale: string;
  organisme_enseigne: string;
  prioritaire: boolean;
  a_contacter: boolean;
  mineur: boolean;
  presque_6_mois: boolean;
  acc_conjoint: boolean;
  rqth: boolean;
  a_traiter: boolean;
};

export type EffectifPriorityData = EffectifData & {
  date_rupture: string;
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
  traite: MonthItem[];
  injoignable: MonthItem[];
};
