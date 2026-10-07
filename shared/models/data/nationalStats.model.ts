import { z } from "zod";

const STATS_PERIODS = ["30days", "3months", "all"] as const;
export const zStatsPeriod = z.enum(STATS_PERIODS);
export type StatsPeriod = z.output<typeof zStatsPeriod>;

const STATS_SEGMENTS = ["all", "rupture", "collab"] as const;
export const zStatsSegment = z.enum(STATS_SEGMENTS);
export type StatsSegment = z.output<typeof zStatsSegment>;

const zStatWithVariation = z.object({
  current: z.number(),
  variation: z.string(),
});

const zSegmentTranches = z.object({
  rdv_pris: z.number(),
  projet_pro_securise: z.number(),
  ne_souhaite_pas_accompagnement: z.number(),
  a_recontacter: z.number(),
  injoignable: z.number(),
  autre: z.number(),
});

export type ISegmentTranches = z.output<typeof zSegmentTranches>;

const zTimeSeriesPoint = z.object({
  date: z.date(),
  stats: z.array(
    z.object({
      total: z.number(),
      total_a_traiter: z.number(),
      total_traites: z.number(),
    })
  ),
});

export type ITimeSeriesPoint = z.output<typeof zTimeSeriesPoint>;

const zRupturantsSummary = z.object({
  a_traiter: zStatWithVariation,
  traites: zStatWithVariation,
  total: z.number(),
});

export type IRupturantsSummary = z.output<typeof zRupturantsSummary>;

const zDetailsDossiersTraitesV2 = z.object({
  rdv_pris: zStatWithVariation,
  projet_pro_securise: zStatWithVariation,
  ne_souhaite_pas_accompagnement: zStatWithVariation,
  a_recontacter: zStatWithVariation,
  injoignable: zStatWithVariation,
  autre: zStatWithVariation,
  total: z.number(),
});

export type IDetailsDossiersTraitesV2 = z.output<typeof zDetailsDossiersTraitesV2>;

const zDossiersTraitesStatsResponse = z.object({
  detailsV2: zDetailsDossiersTraitesV2,
  traites: z.number(),
  deja_connu_accompagne: z.number().nullable(),
  evaluationDate: z.date(),
  period: zStatsPeriod,
  segment: zStatsSegment,
});

export type IDossiersTraitesStatsResponse = z.output<typeof zDossiersTraitesStatsResponse>;

const zRegionStats = z.object({
  code: z.string(),
  nom: z.string(),
  deployed: z.boolean(),
  ml_total: z.number(),
  ml_activees: z.number(),
  ml_activees_delta: z.number(),
  ml_engagees: z.number(),
  ml_engagees_delta: z.number(),
  engagement_rate: z.number(),
  a_traiter: z.number().optional(),
  traites: z.number().optional(),
  traites_variation: z.string().optional(),
});

export type IRegionStats = z.output<typeof zRegionStats>;

/** Code de la ligne regroupant les ML sans département renseigné. */
export const UNKNOWN_DEPARTEMENT_CODE = "inconnu";

const zDepartementStats = zRegionStats.omit({ deployed: true });

export type IDepartementStats = z.output<typeof zDepartementStats>;

const zTraitementStatsData = z.object({
  total: z.number(),
  total_contacte: z.number(),
  total_repondu: z.number(),
  total_accompagne: z.number(),
});

const zTraitementStatsResponse = z.object({
  latest: zTraitementStatsData,
  first: zTraitementStatsData,
  evaluationDate: z.date(),
  period: zStatsPeriod,
  segment: zStatsSegment,
});

export type ITraitementStatsResponse = z.output<typeof zTraitementStatsResponse>;

const zMissionLocaleTraitementStats = z.object({
  id: z.string(),
  nom: z.string(),
  region_code: z.string(),
  region_nom: z.string(),
  total_jeunes: z.number(),
  a_traiter: z.number(),
  traites: z.number(),
  pourcentage_traites: z.number(),
  pourcentage_evolution: z.string(),
  details: zSegmentTranches,
  delai_moyen_jours: z.number().nullable(),
  derniere_activite: z.date().nullable(),
  jours_depuis_activite: z.number().nullable(),
  is_activated: z.boolean(),
  is_engaged: z.boolean(),
  departement_code: z.string().nullish(),
});

export const TRAITEMENT_ML_SORT_FIELDS = [
  "nom",
  "total_jeunes",
  "a_traiter",
  "traites",
  "pourcentage_traites",
  "derniere_activite",
  "jours_depuis_activite",
  "delai_moyen_jours",
] as const;
export const zTraitementMlSortBy = z.enum(TRAITEMENT_ML_SORT_FIELDS);
export type TraitementMlSortBy = z.output<typeof zTraitementMlSortBy>;

const zTraitementMLStatsResponse = z.object({
  data: z.array(zMissionLocaleTraitementStats),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
  period: zStatsPeriod,
  segment: zStatsSegment,
});

export type ITraitementMLStatsResponse = z.output<typeof zTraitementMLStatsResponse>;

const zTraitementRegionStats = z.object({
  code: z.string(),
  nom: z.string(),
  total_jeunes: z.number(),
  a_traiter: z.number(),
  traites: z.number(),
  pourcentage_traites: z.number(),
  ml_actives: z.number(),
});

export type ITraitementRegionStats = z.output<typeof zTraitementRegionStats>;

const zCollaborationObjectifs = z.object({
  mobilite: z.number(),
  logement: z.number(),
  sante: z.number(),
  finance: z.number(),
  administratif: z.number(),
  social_familial: z.number(),
  reorientation: z.number(),
  recherche_emploi: z.number(),
  autre: z.number(),
});

export type ICollaborationObjectifs = z.output<typeof zCollaborationObjectifs>;

const zCollabSituations = z.object({
  rupture: z.number(),
  abandon: z.number(),
  prevention_inevitable: z.number(),
  prevention_tres_eleve: z.number(),
  prevention_modere: z.number(),
  besoin_aide_hors_rupture: z.number(),
  total: z.number(),
});

export type ICollabSituations = z.output<typeof zCollabSituations>;

const zCollabSituationsVariations = z.object({
  rupture: z.string(),
  abandon: z.string(),
  prevention_inevitable: z.string(),
  prevention_tres_eleve: z.string(),
  prevention_modere: z.string(),
  besoin_aide_hors_rupture: z.string(),
});

export type ICollabSituationsVariations = z.output<typeof zCollabSituationsVariations>;

const zCollaborationSegmentStats = z.object({
  evaluationDate: z.date(),
  period: zStatsPeriod,
  cfa_ayant_collabore: zStatWithVariation,
  jeunes_envoyes: zStatWithVariation,
  jeunes_contactes: zStatWithVariation,
  jeunes_accompagnement_accepte: zStatWithVariation,
  resultats: zDetailsDossiersTraitesV2,
  part_deja_connus: z.number(),
  delai_moyen_jours: z.number().nullable(),
  situations: zCollabSituations,
  situations_variations: zCollabSituationsVariations,
  objectifs: zCollaborationObjectifs.extend({ total_dossiers: z.number() }),
});

export type ICollaborationSegmentStats = z.output<typeof zCollaborationSegmentStats>;

const zMissionLocaleExportData = z.object({
  region_nom: z.string(),
  nom: z.string(),
  siret: z.string().nullable(),
  total_jeunes: z.number(),
  a_traiter: z.number(),
  traites: z.number(),
  pourcentage_traites: z.number(),
  pourcentage_a_recontacter: z.number(),
  pourcentage_rdv_pris: z.number(),
  pourcentage_connu_ml: z.number(),
  date_activation: z.date().nullable(),
  derniere_activite: z.date().nullable(),
  rdv_pris: z.number(),
  nouveau_projet: z.number(),
  contacte_sans_retour: z.number(),
  injoignables: z.number(),
  coordonnees_incorrectes: z.number(),
  autre_avec_contact: z.number(),
  cherche_contrat: z.number(),
  reorientation: z.number(),
  ne_veut_pas_accompagnement: z.number(),
  collab_total: z.number(),
  collab_non_traite: z.number(),
  collab_traite: z.number(),
  collab_a_recontacter: z.number(),
});

const zRegionExportData = z.object({
  region_nom: z.string(),
  total_jeunes: z.number(),
  a_traiter: z.number(),
  traites: z.number(),
  pourcentage_traites: z.number(),
  pourcentage_a_recontacter: z.number(),
  pourcentage_rdv_pris: z.number(),
  pourcentage_connu_ml: z.number(),
  ml_actives: z.number(),
  derniere_activite: z.date().nullable(),
  rdv_pris: z.number(),
  nouveau_projet: z.number(),
  contacte_sans_retour: z.number(),
  injoignables: z.number(),
  coordonnees_incorrectes: z.number(),
  autre_avec_contact: z.number(),
  cherche_contrat: z.number(),
  reorientation: z.number(),
  ne_veut_pas_accompagnement: z.number(),
  collab_total: z.number(),
  collab_non_traite: z.number(),
  collab_traite: z.number(),
  collab_a_recontacter: z.number(),
});

const zSegmentExportRow = z.object({
  region_nom: z.string(),
  departement_code: z.string().nullable(),
  departement_nom: z.string(),
  nom: z.string(),
  siret: z.string().nullable(),
  date_activation: z.date().nullable(),
  derniere_activite: z.date().nullable(),
  total_jeunes: z.number(),
  a_traiter: z.number(),
  traites: z.number(),
  pourcentage_traites: z.number(),
  repondu: z.number(),
  rdv_pris: z.number(),
  rdv_pris_decouverts: z.number(),
  projet_pro_securise: z.number(),
  ne_souhaite_pas_accompagnement: z.number(),
  a_recontacter: z.number(),
  injoignable: z.number(),
  autre: z.number(),
  deja_connu_accompagne: z.number(),
});

export type ISegmentExportRow = z.output<typeof zSegmentExportRow>;

const zCollabSegmentExportRow = zSegmentExportRow.extend({
  situation_rupture: z.number(),
  situation_abandon: z.number(),
  situation_prevention_inevitable: z.number(),
  situation_prevention_tres_eleve: z.number(),
  situation_prevention_modere: z.number(),
  situation_besoin_aide_hors_rupture: z.number(),
  delai_moyen_jours: z.number().nullable(),
});

export type ICollabSegmentExportRow = z.output<typeof zCollabSegmentExportRow>;

const zTraitementExportResponse = z.object({
  mlData: z.array(zMissionLocaleExportData),
  regionData: z.array(zRegionExportData),
  rows_rupture: z.array(zSegmentExportRow),
  rows_collab: z.array(zCollabSegmentExportRow),
  exportDate: z.date(),
});

export type ITraitementExportResponse = z.output<typeof zTraitementExportResponse>;

const zWhatsAppStats = z.object({
  summary: z.object({
    totalSent: z.number(),
    responseRate: z.number(),
    totalResponses: z.number(),
    failed: z.number(),
  }),
  responseDistribution: z.object({
    callback: z.number(),
    no_help: z.number(),
    no_response: z.number(),
    opted_out: z.number(),
  }),
  callbackOutcomes: z.object({
    rdv_pris: z.number(),
    nouveau_projet: z.number(),
    deja_accompagne: z.number(),
    injoignable: z.number(),
    coordonnees_incorrect: z.number(),
    autre: z.number(),
    en_attente: z.number(),
  }),
});

export type IWhatsAppStats = z.output<typeof zWhatsAppStats>;

const zPrequalifStats = z.object({
  period: z.string(),
  volume: z.object({
    total_sent: z.number(),
    sent_by_mode: z.object({ backfill: z.number(), daily: z.number() }),
    failed_send: z.number(),
    opted_out: z.number(),
  }),
  responses: z.object({
    yes_count: z.number(),
    no_count: z.number(),
    no_response: z.number(),
    auto_reply_sent: z.number(),
    response_rate: z.number(),
    yes_rate: z.number(),
    opt_out_rate: z.number(),
  }),
  rdv_tracking: z.object({
    tokens_generated: z.number(),
    total_clicks: z.number(),
    unique_clickers: z.number(),
    click_rate: z.number(),
  }),
  ml_activation: z.object({ ml_with_rdv_url: z.number(), ml_total: z.number() }),
});

export type IPrequalifStats = z.output<typeof zPrequalifStats>;

const zCfaAdoptionStats = z.object({
  estimation: z.number(),
  compatibles: z.number(),
  avec_compte: z.number(),
  avec_collaboration: zStatWithVariation,
  period: zStatsPeriod,
});

export type ICfaAdoptionStats = z.output<typeof zCfaAdoptionStats>;

export const CFA_ETABLISSEMENTS_SORT_FIELDS = ["nom", "localisation", "compte", "collaborations", "activite"] as const;
export const zCfaEtablissementsSortBy = z.enum(CFA_ETABLISSEMENTS_SORT_FIELDS);
export type CfaEtablissementsSortBy = z.output<typeof zCfaEtablissementsSortBy>;

const zCfaEtablissement = z.object({
  id: z.string(),
  nom: z.string().nullable(),
  uai: z.string().nullable(),
  siret: z.string(),
  nature: z.string().nullable(),
  qualiopi: z.boolean().nullable(),
  departement: z.string().nullable(),
  adresse: z
    .object({ code_postal: z.string().nullish(), commune: z.string().nullish(), complete: z.string().nullish() })
    .nullable(),
  has_account: z.boolean(),
  collab_active: z.boolean(),
  nb_collaborations: z.number(),
  derniere_activite: z.date().nullable(),
});

export type ICfaEtablissement = z.output<typeof zCfaEtablissement>;

export interface ICfaEtablissementsResponse {
  data: ICfaEtablissement[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const zCollaborationMois = z.object({
  mois: z.string().describe("AAAA-MM, mois d'envoi de la collaboration (Europe/Paris)"),
  envoyes: z.number(),
  contactes: z.number(),
  acceptes: z.number(),
});

export type ICollaborationMois = z.output<typeof zCollaborationMois>;

export interface ICollaborationMensuelStats {
  mois: ICollaborationMois[];
  period: StatsPeriod;
}

export interface ICfaNpsStats {
  nps: number | null;
  total_reponses: number;
  utilisateurs: number;
  cfa: number;
}

export const CFA_INJOIGNABLES_SORT_FIELDS = ["nom", "localisation", "taux"] as const;
export const zCfaInjoignablesSortBy = z.enum(CFA_INJOIGNABLES_SORT_FIELDS);
export type CfaInjoignablesSortBy = z.output<typeof zCfaInjoignablesSortBy>;

export interface ICfaInjoignablesRow {
  organisme_id: string;
  nom: string | null;
  uai: string | null;
  siret: string;
  adresse: { code_postal?: string | null; commune?: string | null; complete?: string | null } | null;
  traites: number;
  injoignables: number;
  taux: number;
}

export const COLLAB_DOSSIER_STATUTS = ["a_traiter", "a_recontacter", "traite"] as const;
export type CollabDossierStatut = (typeof COLLAB_DOSSIER_STATUTS)[number];

export const COLLAB_DOSSIER_DELAIS = ["0_10", "11_20", "21_30", "30_plus"] as const;
export type CollabDossierDelai = (typeof COLLAB_DOSSIER_DELAIS)[number];

export const COLLAB_DOSSIER_RESULTATS = [
  "rdv_pris",
  "projet_pro_securise",
  "ne_souhaite_pas_accompagnement",
  "a_recontacter",
  "injoignable",
  "autre",
] as const;
export type CollabDossierResultat = (typeof COLLAB_DOSSIER_RESULTATS)[number];

export interface ICollaborationDossierStructure {
  id: string;
  nom: string | null;
  commune: string | null;
}

/** Dossier de collaboration affiché aux profils indicateurs : seuls le prénom et le nom du jeune sont exposés. */
export interface ICollaborationDossier {
  id: string;
  jeune: { prenom: string | null; nom: string | null };
  mission_locale: ICollaborationDossierStructure;
  cfa: ICollaborationDossierStructure;
  statut: CollabDossierStatut;
  situation: string | null;
  motifs: string[];
  resultat: CollabDossierResultat | null;
  date_envoi: Date;
  delai_jours: number;
  traite_par_ml: boolean;
}

export interface ICollaborationDossiersResponse {
  total: number;
  pagination: { page: number; limit: number; total_pages: number };
  data: ICollaborationDossier[];
  filtres: { cfa: ICollaborationDossierStructure[]; ml: ICollaborationDossierStructure[] };
}

/** Longueur minimale d'une recherche d'établissements : en dessous, aucune requête n'est lancée. */
export const RECHERCHE_LONGUEUR_MIN = 3;

interface IRechercheResultatBase {
  id: string;
  nom: string | null;
  adresse: { code_postal: string | null; commune: string | null; complete: string | null };
  derniere_activite: Date | null;
}

export interface IRechercheResultatCfa extends IRechercheResultatBase {
  type: "cfa";
  uai: string | null;
  siret: string;
  compte_tba: boolean;
  invitations_recues: number;
  collaborations_envoyees: number;
}

export interface IRechercheResultatMl extends IRechercheResultatBase {
  type: "ml";
  compte_tba: boolean;
  ruptures: { a_traiter: number; traites: number };
  collaborations: { recues: number; traitees: number };
}

export type IRechercheResultat = IRechercheResultatCfa | IRechercheResultatMl;

export interface IRechercheResponse {
  total: number;
  pagination: { page: number; limit: number; total_pages: number };
  data: IRechercheResultat[];
}
