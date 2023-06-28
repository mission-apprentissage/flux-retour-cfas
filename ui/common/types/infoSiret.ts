export type InfoSiret = {
  result?: {
    siret?: string;
    siege_social?: boolean;
    etablissement_siege_siret?: string;
    date_creation?: Date;
    date_fermeture?: Date;
    siren?: string;
    naf_code?: string;
    naf_libelle?: string;
    diffusable_commercialement?: boolean;
    enseigne?: string;
    raison_sociale?: string;
    tranche_effectif_salarie_etablissement?: {
      de?: number;
    };
    numero_voie?: number;
    nom_voie?: string;
    commune_implantation_nom?: string;
    type_voie?: string;
    voie_complete?: string;
    complement_adresse?: string;
    code_postal?: string;
    code_insee_localite?: string;
    localite?: string;
    cedex?: string;
    nom_departement?: string;
    num_departement?: string;
    region?: string;
    num_region?: string;
    nom_academie?: string;
    num_academie?: string;
    adresse?: string;
    conventionCollective?: {
      idcc?: string;
      opco_nom?: string;
      opco_siren?: string;
      status?: string;
    };
    ferme?: boolean;
    secretSiret?: boolean;
    api_entreprise_reference?: boolean;
  };

  messages?: {
    api_entreprise_info?: string;
    api_entreprise_status?: "OK" | "KO";
  };

  error?: string;
};
