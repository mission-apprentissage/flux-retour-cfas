export type CfdInfo = {
  date_fermeture: Date | null;
  date_ouverture: Date | null;
  niveau: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | null;
  intitule_long: string;
  rncps: Array<{
    code_rncp: string;
    intitule_diplome: string;
    date_fin_validite_enregistrement: Date | null;
    active_inactive: "ACTIVE" | "INACTIVE";
    eligible_apprentissage: boolean;
    eligible_professionnalisation: boolean;
  }>;
};

export type RncpInfo = {
  code_rncp: string;
  intitule: string;
  niveau: string | null;
  date_fin_validite_enregistrement: Date | null;
  actif: boolean;
  eligible_apprentissage: boolean;
  eligible_professionnalisation: boolean;
  romes: { code: string; intitule: string }[];
};
