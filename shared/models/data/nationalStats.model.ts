import { z } from "zod";

export const STATS_PERIODS = ["30days", "3months", "all"] as const;
export const zStatsPeriod = z.enum(STATS_PERIODS);
export type StatsPeriod = z.output<typeof zStatsPeriod>;

const zStatWithVariation = z.object({
  current: z.number(),
  variation: z.string(),
});

export type IStatWithVariation = z.output<typeof zStatWithVariation>;

const zAggregatedStats = z.object({
  total: z.number(),
  total_a_traiter: z.number(),
  total_traites: z.number(),
  rdv_pris: z.number(),
  nouveau_projet: z.number(),
  deja_accompagne: z.number(),
  contacte_sans_retour: z.number(),
  injoignables: z.number(),
  coordonnees_incorrectes: z.number(),
  autre: z.number(),
  deja_connu: z.number(),
});

export type IAggregatedStats = z.output<typeof zAggregatedStats>;

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

const zDetailsDossiersTraites = z.object({
  rdv_pris: zStatWithVariation,
  nouveau_projet: zStatWithVariation,
  contacte_sans_retour: zStatWithVariation,
  deja_accompagne: zStatWithVariation,
  injoignables: zStatWithVariation,
  coordonnees_incorrectes: zStatWithVariation,
  autre: zStatWithVariation,
  deja_connu: z.number(),
  total: z.number(),
});

export type IDetailsDossiersTraites = z.output<typeof zDetailsDossiersTraites>;

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

const zRegionalStatsResponse = z.object({
  regions: z.array(zRegionStats),
});

export type IRegionalStatsResponse = z.output<typeof zRegionalStatsResponse>;

const zTraitementStats = z.object({
  total: z.number(),
  total_previous: z.number(),
  total_contacte: z.number(),
  total_contacte_previous: z.number(),
  total_repondu: z.number(),
  total_repondu_previous: z.number(),
  total_accompagne: z.number(),
  total_accompagne_previous: z.number(),
});

export type ITraitementStats = z.output<typeof zTraitementStats>;

const zNationalStats = z.object({
  rupturantsTimeSeries: z.array(zTimeSeriesPoint),
  rupturantsSummary: zRupturantsSummary,
  detailsTraites: zDetailsDossiersTraites,
  regional: zRegionalStatsResponse,
  evaluationDate: z.date(),
  period: zStatsPeriod,
  traitement: z.object({
    latest: z.object({
      total: z.number(),
      total_contacte: z.number(),
      total_repondu: z.number(),
      total_accompagne: z.number(),
    }),
    first: z.object({
      total: z.number(),
      total_contacte: z.number(),
      total_repondu: z.number(),
      total_accompagne: z.number(),
    }),
  }),
});

export type INationalStats = z.output<typeof zNationalStats>;

const zTraitementStatsData = z.object({
  total: z.number(),
  total_contacte: z.number(),
  total_repondu: z.number(),
  total_accompagne: z.number(),
});

export type ITraitementStatsData = z.output<typeof zTraitementStatsData>;

const zTraitementStatsResponse = z.object({
  latest: zTraitementStatsData,
  first: zTraitementStatsData,
  evaluationDate: z.date(),
  period: zStatsPeriod,
});

export type ITraitementStatsResponse = z.output<typeof zTraitementStatsResponse>;

const zTraitementDetails = z.object({
  rdv_pris: z.number(),
  nouveau_projet: z.number(),
  deja_accompagne: z.number(),
  contacte_sans_retour: z.number(),
  injoignables: z.number(),
  coordonnees_incorrectes: z.number(),
  autre: z.number(),
});

export type ITraitementDetails = z.output<typeof zTraitementDetails>;

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
  details: zTraitementDetails,
  derniere_activite: z.date().nullable(),
  jours_depuis_activite: z.number().nullable(),
});

export type IMissionLocaleTraitementStats = z.output<typeof zMissionLocaleTraitementStats>;

const zTraitementMLStatsResponse = z.object({
  data: z.array(zMissionLocaleTraitementStats),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
  period: zStatsPeriod,
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

const zSyntheseStats = z.object({
  summary: z.object({
    mlCount: z.number(),
    activatedMlCount: z.number(),
    previousActivatedMlCount: z.number(),
    date: z.date(),
  }),
  regions: z.array(zRegionStats),
  traitement: z.object({
    latest: zTraitementStatsData,
    first: zTraitementStatsData,
  }),
  evaluationDate: z.date(),
  period: zStatsPeriod,
});

export type ISyntheseStats = z.output<typeof zSyntheseStats>;

const zAccompagnementConjointMotifs = z.object({
  mobilite: z.number(),
  logement: z.number(),
  sante: z.number(),
  finance: z.number(),
  administratif: z.number(),
  reorientation: z.number(),
  recherche_emploi: z.number(),
  autre: z.number(),
});

export type IAccompagnementConjointMotifs = z.output<typeof zAccompagnementConjointMotifs>;

const zAccompagnementConjointStats = z.object({
  cfaPartenaires: z.number(),
  mlConcernees: z.number(),
  regionsActives: z.array(z.string()),
  totalJeunesRupturants: z.number(),
  totalDossiersPartages: z.number(),
  totalDossiersTraites: z.number(),
  pourcentageTraites: z.number(),
  motifs: zAccompagnementConjointMotifs,
  statutsTraitement: zTraitementDetails,
  dejaConnu: z.number(),
  totalPourDejaConnu: z.number(),
  evaluationDate: z.coerce.date(),
});

export type IAccompagnementConjointStats = z.output<typeof zAccompagnementConjointStats>;

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
  deja_accompagne: z.number(),
  contacte_sans_retour: z.number(),
  injoignables: z.number(),
  coordonnees_incorrectes: z.number(),
  autre: z.number(),
});

export type IMissionLocaleExportData = z.output<typeof zMissionLocaleExportData>;

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
  deja_accompagne: z.number(),
  contacte_sans_retour: z.number(),
  injoignables: z.number(),
  coordonnees_incorrectes: z.number(),
  autre: z.number(),
});

export type IRegionExportData = z.output<typeof zRegionExportData>;

const zTraitementExportResponse = z.object({
  mlData: z.array(zMissionLocaleExportData),
  regionData: z.array(zRegionExportData),
  exportDate: z.date(),
});

export type ITraitementExportResponse = z.output<typeof zTraitementExportResponse>;

export default { zod: zNationalStats };
