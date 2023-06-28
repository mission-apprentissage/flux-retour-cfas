type ApiEntEtablissement = {
  siret: string;
  etat_administratif: string;
  enseigne: any;
  activite_principale: {
    code: string;
  };
  unite_legale: {
    personne_morale_attributs: {
      raison_sociale: string;
    };
  };
  tranche_effectif_salarie_etablissement: {
    de: number;
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
