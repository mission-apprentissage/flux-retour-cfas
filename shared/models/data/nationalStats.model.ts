import { z } from "zod";

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
  evaluationDate: z.date(),
  period: z.enum(["30days", "3months", "all"]),
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
  period: z.enum(["30days", "3months", "all"]),
});

export type ITraitementStatsResponse = z.output<typeof zTraitementStatsResponse>;

export default { zod: zNationalStats };
