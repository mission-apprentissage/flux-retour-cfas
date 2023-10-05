export interface DuplicateEffectifDetail {
  _id: string;
  created_at: string;
  updated_at: string;
  source: string;
  id_erp_apprenant: string;
  annee_scolaire: string;
  apprenant?: {
    nom?: string;
    prenom?: string;
    ine?: string;
    date_de_naissance?: string;
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
    historique_statut?: [
      {
        valeur_statut?: string;
        date_statut?: string;
        date_reception?: string;
      },
    ];
  };
  formation?: {
    libelle_long?: string;
    cfd?: string;
    rncp?: string;
    periode?: string;
    annee?: string;
  };
  contrats?: [
    {
      date_debut?: string;
      date_fin?: string;
      date_rupture?: string;
      cause_rupture?: string;
    },
  ];
}
