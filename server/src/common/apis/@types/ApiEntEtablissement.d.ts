type ApiEntEtablissement = {
  siege_social: boolean;
  siret: string;
  naf: string;
  libelle_naf: string;
  date_mise_a_jour: number;
  tranche_effectif_salarie_etablissement: {
    de: number;
    a: number;
    code: string;
    date_reference: string;
    intitule: string;
  };
  date_creation_etablissement: number;
  region_implantation: {
    code: string;
    value: string;
  };
  commune_implantation: {
    code: string;
    value: string;
  };
  pays_implantation: {
    code: string;
    value: string;
  };
  diffusable_commercialement: boolean;
  enseigne: any;
  adresse: {
    l1: string;
    l2: any;
    l3: any;
    l4: string;
    l5: any;
    l6: string;
    l7: string;
    numero_voie: string;
    type_voie: string;
    nom_voie: string;
    complement_adresse: any;
    code_postal: string;
    localite: string;
    code_insee_localite: string;
    cedex: any;
  };
  etat_administratif: {
    value: string;
    date_fermeture: any;
  };
};

export default ApiEntEtablissement;
