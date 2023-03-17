type TabCoRncpInfo = {
  result: {
    _id: string;
    cfds: any;
    code_rncp: string;
    intitule_diplome: string;
    date_fin_validite_enregistrement: string;
    active_inactive: string;
    etat_fiche_rncp: string;
    niveau_europe: string;
    code_type_certif: string;
    type_certif: string;
    ancienne_fiche: any;
    nouvelle_fiche: Array<string>;
    demande: number;
    certificateurs: Array<{
      certificateur: string;
      siret_certificateur: any;
    }>;
    nsf_code: string;
    nsf_libelle: string;
    romes: Array<{
      rome: string;
      libelle: string;
    }>;
    blocs_competences: any;
    voix_acces: any;
    partenaires: any;
    type_enregistrement: string;
    si_jury_ca: string;
    eligible_apprentissage: boolean;
    created_at: string;
    last_update_at: string;
    __v: number;
    rncp_outdated: boolean;
    cfd: Record<string, any>;
    mefs: Record<string, any>;
  };
  messages: {
    code_rncp: string;
    cfd: Record<string, any>;
    mefs: Record<string, any>;
  };
};

export default TabCoRncpInfo;
