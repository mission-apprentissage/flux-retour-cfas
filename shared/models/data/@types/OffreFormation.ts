interface Adresse {
  code_postal: string;
  code_commune_insee: string;
  num_departement?: string | null | undefined;
  region?: string | null | undefined;
  localite?: string | null | undefined;
  adresse: string | null;
  nom_academie?: string | null | undefined;
  num_academie?: string | null | undefined;
}

type OptionalAdresse = {
  [K in keyof Adresse]: string | null;
};

interface Etablissement {
  id_catalogue: string | null;
  siret: string;
  uai: string | null;
  enseigne: string | null;
  habilite_rncp: boolean | null;
  certifie_qualite: boolean | null;
  adresse: OptionalAdresse;
  raison_sociale: string | null | undefined;
  date_creation: string | null | undefined;
  reference: boolean;
}

export interface OffreFormation {
  id_catalogue: string | null;
  cle_ministere_educatif: string;

  cfd: {
    code: string;
    outdated: boolean;
    date_fermeture: string | null;
  };

  niveau: {
    libelle: string | null | undefined;
    entree_obligatoire: number | null;
  };

  nature: {
    libelle: string | null | undefined;
    code: string | null | undefined;
  };

  duree: {
    theorique: string;
    incoherente: boolean | null | undefined;
  };

  annee: {
    num: string;
    incoherente: boolean | null | undefined;
  };

  intitule_long: string | null | undefined;
  intitule_court: string | null | undefined;

  onisep: {
    url: string;
    intitule: string;
    libelle_poursuite: string | null;
    lien_site_onisepfr: string;
    discipline: string;
    domaine_sousdomaine: string;
  } | null;

  rncps: {
    code: string;
    intitule: string;
    date_fin_validite_enregistrement: string;
    active_inactive: string;
    eligible_apprentissage: boolean | null;
    eligible_professionnalisation: boolean | null;
  }[];

  lieu_formation: {
    adresse: Adresse;
    siret: string | null;
  };

  entierement_a_distance: boolean;

  sessions: {
    debut: string;
    fin: string;
  }[];

  gestionnaire: Etablissement;
  formateur: Etablissement;
}
