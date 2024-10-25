type CfdInfo = {
  date_fermeture: Date | null;
  date_ouverture: Date | null;
  niveau: string | null;
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

export default CfdInfo;
