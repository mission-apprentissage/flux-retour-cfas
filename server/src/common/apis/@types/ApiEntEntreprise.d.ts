type ApiEntEntreprise = {
  siren: string;
  capital_social: any;
  numero_tva_intracommunautaire: string;
  forme_juridique: string;
  forme_juridique_code: string;
  nom_commercial: string;
  procedure_collective: boolean;
  enseigne: any;
  libelle_naf_entreprise: string;
  naf_entreprise: string;
  raison_sociale: string;
  siret_siege_social: string;
  code_effectif_entreprise: string;
  date_creation: number;
  nom: any;
  prenom: any;
  date_radiation: any;
  categorie_entreprise: string;
  tranche_effectif_salarie_entreprise: {
    de: number;
    a: number;
    code: string;
    date_reference: string;
    intitule: string;
  };
  mandataires_sociaux: Array<any>;
  etat_administratif: {
    value: string;
    date_cessation: any;
  };
};

export default ApiEntEntreprise;
