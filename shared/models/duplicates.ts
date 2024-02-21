export interface DuplicateEffectifDetail {
  id: string;
  created_at: string;
  updated_at: string;
  source: string;
  id_erp_apprenant: string;
  annee_scolaire: string;
  apprenant?: {
    nom: string;
    prenom: string;
    ine?: string;
    date_de_naissance?: Date;
    courriel?: string;
    telephone?: string;
    adresse?: {
      code_insee?: string;
      code_postal?: string;
      commune?: string;
      departement?: string;
      academie?: string;
      region?: string;
    };
    historique_statut: [
      {
        valeur_statut?: 2 | 3 | 0;
        date_statut?: string;
        date_reception?: string;
      },
    ];
  };
  formation?: {
    libelle_long?: string;
    cfd?: string;
    rncp?: string;
    periode: string[];
    annee?: string;
  };
  contrats?: [
    {
      date_debut: Date;
      date_fin?: Date;
      date_rupture?: Date;
      cause_rupture?: string;
    },
  ];
}

export interface DuplicateEffectifGroup {
  _id: {
    id_erp_apprenant: string;
    annee_scolaire: string;
  };
  count: number;
  duplicates: DuplicateEffectifDetail[];
  firstNomApprenant: string;
  firstPrenomApprenant: string;
}

export interface DuplicateEffectifGroupTransformer extends DuplicateEffectifGroup {
  nom_apprenant: string;
  prenom_apprenant: string;
  date_de_naissance_apprenant: string | Date;
  code_diplome_apprenant: string;
  source: string;
  dossier_cree_le: Date;
}

export interface DuplicateEffectifGroupPagination {
  totalItems: number;
  data: DuplicateEffectifGroup[];
}
