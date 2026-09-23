type ApiEntEtablissement = {
  siret: string;
  siren: string;
  date_creation: number;
  date_fermeture: number | null;
  etat_administratif: string;
  enseigne: string | null;
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
    complement_adresse: string | null;
    numero_voie: string;
    type_voie: string;
    libelle_voie: string;
    code_postal: string;
    libelle_commune: string;
    code_commune: string;
    code_cedex: string | null;
    acheminement_postal: {
      l1: string;
      l2: string | null;
      l3: string | null;
      l4: string;
      l5: string | null;
      l6: string;
      l7: string;
    };
  };
};

export default ApiEntEtablissement;
