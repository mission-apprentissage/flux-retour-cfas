export type EffectifData = {
  id: string;
  nom: string;
  prenom: string;
  libelle_formation: string;
};

export type MonthItem = {
  month: string;
  data: EffectifData[];
};

export type SelectedSection = "a-traiter" | "deja-traite";

export type MonthsData = {
  a_traiter: MonthItem[];
  traite: MonthItem[];
};
