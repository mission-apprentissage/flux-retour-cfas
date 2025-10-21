export interface ISecteurArborescence {
  code_secteur: number;
  libelle_secteur: string;
  count: number;
}

export interface IArborescenceResponse {
  a_traiter: {
    total: number;
    secteurs: ISecteurArborescence[];
  };
  traite: number;
}

export interface IEffectifFranceTravail {
  _id: string;
  effectif_id: string;
  effectif_snapshot: {
    apprenant: {
      nom: string;
      prenom: string;
      rqth?: boolean;
    };
    formation: {
      libelle_long?: string;
      niveau?: string;
      rncp?: string;
    };
  };
  organisme?: {
    _id: string;
    nom?: string;
    raison_sociale?: string;
    enseigne?: string;
  };
  jours_sans_contrat: number;
  current_status: {
    date: string;
    valeur_courante: number;
  };
  ft_data?: Record<string, unknown>;
}

export interface IEffectifsBySecteurResponse {
  effectifs: IEffectifFranceTravail[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
