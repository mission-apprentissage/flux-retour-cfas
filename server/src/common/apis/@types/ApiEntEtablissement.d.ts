type ApiEntEtablissement = {
  siret: string;
  siege_social: boolean;
  etat_administratif: string;
  date_fermeture: number;
  enseigne: any;
  activite_principale: {
    code: string;
    nomenclature: string;
    libelle: string;
  };
  tranche_effectif_salarie_etablissement: {
    de: number;
    a: number;
    code: string;
    date_reference: string;
    intitule: string;
  };
  diffusable_commercialement: boolean;
  date_creation: number;
  unite_legale: {
    siret_siege_social: string;
    personne_morale_attributs: {
      raison_sociale: string;
    };
  };
  adresse: {
    complement_adresse: any;
    numero_voie: string;
    type_voie: string;
    libelle_voie: string;
    code_postal: string;
    libelle_commune: string;
    code_commune: string;
    code_cedex: any;
    acheminement_postal: {
      l1: string;
      l2: any;
      l3: any;
      l4: string;
      l5: any;
      l6: string;
      l7: string;
    };
  };
};

export default ApiEntEtablissement;
