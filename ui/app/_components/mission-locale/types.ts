export type EffectifData = {
  id: string;
  nom: string;
  prenom: string;
  libelle_formation: string;
  organisme_nom: string;
  organisme_raison_sociale: string;
  organisme_enseigne: string;
  prioritaire: boolean;
};

export type EffectifPriorityData = EffectifData & {
  dernier_statut: {
    date: string;
    statut: string;
  };
};

export type MonthItem = {
  month: string;
  data: EffectifData[];
  treated_count?: number;
};

export type SelectedSection = "a-traiter" | "deja-traite" | "injoignable";

export type MonthsData = {
  a_traiter: MonthItem[];
  prioritaire: EffectifData[];
  traite: MonthItem[];
  injoignable: MonthItem[];
  hadEffectifsPrioritaires: boolean;
};
