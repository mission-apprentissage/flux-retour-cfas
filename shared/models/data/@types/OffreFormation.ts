interface Adresse {
  code_postal: string;
  code_commune_insee: string;
  num_departement: string;
  region: string;
  localite: string;
  adresse: string | null;
  nom_academie: string;
  num_academie: string;
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
  raison_sociale: string;
  date_creation: string;
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
    libelle: string;
    entree_obligatoire: number | null;
  };

  nature: {
    libelle: string;
    code: string;
  };

  duree: {
    theorique: string;
    incoherente: boolean;
  };

  annee: {
    num: string;
    incoherente: boolean;
  };

  intitule_long: string;
  intitule_court: string;

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
    etat_fiche_rncp: string;
    rncp_outdated: boolean;
    code_type_certif: string;
    eligible_apprentissage: boolean | null;
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
