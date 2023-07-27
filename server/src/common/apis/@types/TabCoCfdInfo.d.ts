type TabCoCfdInfo = {
  cfd: string;
  cfd_outdated: boolean;
  date_fermeture: any;
  date_ouverture: number;
  specialite: any;
  niveau: string;
  intitule_long: string;
  intitule_court: string;
  diplome: string;
  libelle_court: string;
  niveau_formation_diplome: string;
  rncps: Array<{
    _id: string;
    cfds: Array<string>;
    code_rncp: string;
    intitule_diplome: string;
    date_fin_validite_enregistrement: string;
    active_inactive: string;
    etat_fiche_rncp: string;
    niveau_europe: string;
    code_type_certif: string;
    type_certif: string;
    ancienne_fiche: Array<string>;
    nouvelle_fiche: any;
    demande: number;
    certificateurs: Array<{
      certificateur: string;
      siret_certificateur?: string;
    }>;
    nsf_code: string;
    nsf_libelle: string;
    romes: Array<{
      rome: string;
      libelle: string;
    }>;
    blocs_competences: Array<{
      numero_bloc: string;
      intitule: string;
      liste_competences: string;
      modalites_evaluation: string;
    }>;
    voix_acces: any;
    partenaires: Array<{
      Nom_Partenaire: string;
      Siret_Partenaire: string;
      Habilitation_Partenaire: string;
    }>;
    type_enregistrement: string;
    si_jury_ca: string;
    eligible_apprentissage: boolean;
    created_at: string;
    last_update_at: string;
    __v: number;
    rncp_outdated: boolean;
  }>;
  mefs: {
    mefs10: Array<{
      mef10: string;
      modalite: {
        duree: string;
        annee: string;
      };
    }>;
    mefs8: Array<string>;
    mefs_aproximation: Array<any>;
    mefs11: Array<string>;
    mef10: string;
    modalite: {
      duree: string;
      annee: string;
    };
  };
  onisep: {
    url: any;
  };
};
{
  string;
  string;
  string;
  string;
  string;
  string;
  string;
  string;
  Array<{
    rncp: string;
    messages: string;
  }>;
  {
    string;
    string;
    string;
    string;
    string;
    string;
  }
  {
    string;
  }
}

export default TabCoCfdInfo;
