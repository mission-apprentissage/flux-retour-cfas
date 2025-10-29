export interface ISecteurArborescence {
  code_secteur: number;
  libelle_secteur: string;
  count: number;
}

export interface IArborescenceResponse {
  a_traiter: {
    total: number;
    secteurs: ISecteurArborescence[];
  };
  traite: number;
}

export interface IEffectifFranceTravail {
  _id: string;
  effectif_id: string;
  effectif_snapshot: {
    apprenant: {
      nom: string;
      prenom: string;
      rqth?: boolean;
    };
    formation: {
      libelle_long?: string;
      niveau?: string;
      rncp?: string;
      niveau_libelle?: string;
    };
  };
  organisme?: {
    _id: string;
    nom?: string;
    raison_sociale?: string;
    enseigne?: string;
  };
  jours_sans_contrat: number;
  current_status: {
    date: string;
    valeur_courante: number;
  };
  ft_data?: Record<string, unknown>;
  date_traitement?: string;
}

export interface IEffectifsBySecteurResponse {
  effectifs: IEffectifFranceTravail[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export enum FranceTravailSituation {
  REORIENTATION = "REORIENTATION",
  ENTREPRISE = "ENTREPRISE",
  PAS_DE_RECONTACT = "PAS_DE_RECONTACT",
  EVENEMENT = "EVENEMENT",
  MISSION_LOCALE = "MISSION_LOCALE",
  ERROR = "ERROR",
}

export interface IEffectifDetail {
  id: string;
  nom: string;
  prenom: string;
  date_de_naissance?: string;
  adresse?: {
    numero?: number;
    repetition_voie?: string;
    libelle_voie?: string;
    complement?: string;
    code_postal?: string;
    commune?: string;
    departement?: string;
    academie?: { nom: string; code: string };
    region?: string;
  };
  formation?: {
    libelle_long?: string;
    libelle_court?: string;
    niveau?: string;
    rncp?: string;
    cfd?: string;
    periode?: [string, string];
    niveau_libelle?: string;
  };
  courriel?: string;
  telephone?: string;
  referent_handicap?: { nom: string; email: string; prenom: string };
  rqth?: boolean;
  transmitted_at?: string;
  source?: string;
  contrats?: Array<{
    date_debut?: string;
    date_fin?: string;
    date_rupture?: string;
  }>;
  ft_data?: Record<
    string,
    {
      situation: FranceTravailSituation;
      commentaire: string | null;
      created_at: string;
      created_by: string;
    } | null
  >;
  organisme?: {
    _id: string;
    nom?: string;
    raison_sociale?: string;
    enseigne?: string;
    adresse?: {
      numero?: number;
      repetition_voie?: string;
      libelle_voie?: string;
      complement?: string;
      code_postal?: string;
      commune?: string;
      departement?: string;
      academie?: { nom: string; code: string };
      region?: string;
    };
    telephone?: string;
    email?: string;
  };
  date_inscription?: string;
}

export interface IEffectifDetailResponse {
  effectif: IEffectifDetail;
  total: number;
  next: { id: string; nom: string; prenom: string } | null;
  previous: { id: string; nom: string; prenom: string } | null;
  currentIndex: number | null;
  nomListe: "a_traiter" | "traite";
}

export interface IMoisTraite {
  mois: string;
  count: number;
}

export interface IMoisTraitesResponse {
  mois: IMoisTraite[];
}

export interface IEffectifsTraitesParMoisResponse {
  effectifs: IEffectifFranceTravail[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  mois: string;
}
