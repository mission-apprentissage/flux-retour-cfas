export type InfoSiret = {
  result?: {
    naf_code?: string;
    enseigne?: string;
    raison_sociale?: string;
    tranche_effectif_salarie_etablissement?: {
      de?: number;
    };
    numero_voie?: number;
    nom_voie?: string;
    commune_implantation_nom?: string;
    type_voie?: string;
    complement_adresse?: string;
    code_postal?: string;
    num_departement?: string;
    num_region?: string;
    ferme?: boolean;
    secretSiret?: boolean;
  };

  messages?: {
    api_entreprise_info?: string;
    api_entreprise_status?: "OK" | "KO";
  };

  error?: string;
};
