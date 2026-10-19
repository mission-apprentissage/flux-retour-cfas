import { ObjectId } from "bson";
import { DEPARTEMENTS_BY_CODE } from "shared/constants/territoires";
import { IOrganisationMissionLocale } from "shared/models";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import type { ICollabSegmentStats } from "shared/models/data/missionLocaleStats.model";
import {
  ICollabSegmentExportRow,
  ICollaborationMensuelStats,
  ICollaborationMois,
  ICollaborationSegmentStats,
  IDetailsDossiersTraitesV2,
  IDossiersTraitesStatsResponse,
  IPrequalifStats,
  IRupturantsSummary,
  ISegmentExportRow,
  ITimeSeriesPoint,
  ITraitementMLStatsResponse,
  ITraitementRegionStats,
  ITraitementStatsResponse,
  StatsPeriod,
  StatsSegment,
  TraitementMlSortBy,
  UNKNOWN_DEPARTEMENT_CODE,
} from "shared/models/data/nationalStats.model";
import { normalizeToUTCDay } from "shared/utils/date";
import { getBornesNaissanceMissionLocale } from "shared/utils/missionLocaleAge";
import { calculatePercentage } from "shared/utils/stats";

import {
  missionLocaleEffectifsDb,
  missionLocaleStatsDb,
  organisationsDb,
  organismesDb,
} from "@/common/model/collections";
import { escapeRegex } from "@/common/utils/usersFiltersUtils";

import { getOrganisationById } from "../organisations.actions";

import {
  buildCumulativeStatsPipeline,
  buildDelaiMoyenExpr,
  buildLatestPerMlStages,
  buildLatestStatsMatch,
  buildOrgLookupPipeline,
  buildPercentageExpression,
  buildRegionLookupPipeline,
  buildSegmentSumAccumulators,
  buildSegmentViewExpr,
  buildTotalTraitesV2Expression,
  calculateStartDateAsync,
  createStatWithVariation,
  EMPTY_COLLAB_SEGMENT_STATS,
  ENGAGEMENT_THRESHOLD,
  getLatestStatsLowerBound,
  getMissionLocaleIdsByRegions,
  TIME_SERIES_POINTS_COUNT,
  withMissionLocaleFilter,
} from "./mission-locale-stats.helpers";
import { computeMissionLocaleStats } from "./mission-locale.actions";

export const createOrUpdateMissionLocaleStats = async (missionLocaleId: ObjectId, date?: Date) => {
  const dateToUse = normalizeToUTCDay(date ?? new Date());

  const ml = (await getOrganisationById(missionLocaleId)) as IOrganisationMissionLocale;
  const { stats, segments } = await computeMissionLocaleStats(ml, dateToUse);

  await missionLocaleStatsDb().findOneAndUpdate(
    {
      mission_locale_id: missionLocaleId,
      computed_day: dateToUse,
    },
    {
      $set: {
        stats,
        segments,
        updated_at: new Date(),
        computed_day: dateToUse,
      },
      $setOnInsert: {
        mission_locale_id: ml._id,
        created_at: new Date(),
        _id: new ObjectId(),
      },
    },
    {
      upsert: true,
    }
  );
};

export const getSummaryStats = async (evaluationDate: Date, period: StatsPeriod = "all") => {
  const normalizedDate = normalizeToUTCDay(evaluationDate);

  const startDate = await calculateStartDateAsync(period, normalizedDate);

  const [result] = await organisationsDb()
    .aggregate([
      { $match: { type: "MISSION_LOCALE" } },
      {
        $facet: {
          total: [{ $count: "count" }],
          activatedCurrent: [{ $match: { activated_at: { $lte: normalizedDate } } }, { $count: "count" }],
          activatedPrevious: [{ $match: { activated_at: { $lte: startDate } } }, { $count: "count" }],
        },
      },
    ])
    .toArray();

  const mlCount = result?.total[0]?.count || 0;
  const activatedMlCount = result?.activatedCurrent[0]?.count || 0;
  const previousActivatedMlCount = result?.activatedPrevious[0]?.count || 0;

  return {
    mlCount,
    activatedMlCount,
    previousActivatedMlCount,
    date: normalizedDate,
  };
};

const aggregateSegmentStats = async (
  matchFilter: Record<string, unknown>,
  sortOrder: 1 | -1,
  segment: StatsSegment
): Promise<ICollabSegmentStats> => {
  const [result] = await missionLocaleStatsDb()
    .aggregate([
      ...buildLatestPerMlStages(matchFilter, sortOrder),
      { $addFields: { view: buildSegmentViewExpr(segment) } },
      { $group: { _id: null, ...buildSegmentSumAccumulators() } },
      { $project: { _id: 0 } },
    ])
    .toArray();

  return { ...EMPTY_COLLAB_SEGMENT_STATS, ...(result as Partial<ICollabSegmentStats> | undefined) };
};

/** Somme, sur les ML du périmètre, du dernier document de stats connu à `endDate` pour le segment. */
export const getSegmentStatsForPeriod = (
  endDate: Date,
  missionLocaleIds: ObjectId[] | undefined,
  segment: StatsSegment
) => aggregateSegmentStats(buildLatestStatsMatch(endDate, missionLocaleIds), -1, segment);

/** Somme, sur les ML du périmètre, du premier document de stats de la fenêtre `[startDate, endDate]`. */
const getFirstSegmentStatsInPeriod = (
  startDate: Date,
  endDate: Date,
  missionLocaleIds: ObjectId[] | undefined,
  segment: StatsSegment
) =>
  aggregateSegmentStats(
    withMissionLocaleFilter({ computed_day: { $gte: startDate, $lte: endDate } }, missionLocaleIds),
    1,
    segment
  );

export const getCumulativeStatsForDates = async (
  dates: Date[],
  missionLocaleIds: ObjectId[] | undefined,
  segment: StatsSegment
) => {
  if (dates.length === 0) return [];

  const facetPipelines: Record<string, object[]> = {};
  dates.forEach((date, index) => {
    facetPipelines[`date_${index}`] = buildCumulativeStatsPipeline(date, missionLocaleIds, segment);
  });

  const maxDate = dates.reduce((max, d) => (d > max ? d : max), dates[0]);

  const initialMatchFilter = withMissionLocaleFilter({ computed_day: { $lte: maxDate } }, missionLocaleIds);

  const [result] = await missionLocaleStatsDb()
    .aggregate([{ $match: initialMatchFilter }, { $facet: facetPipelines }], { allowDiskUse: true })
    .toArray();

  return dates.map((date, index) => {
    const stats = result?.[`date_${index}`]?.[0] || { total: 0, total_a_traiter: 0, total_traites: 0 };
    return {
      date,
      stats: [
        {
          total: stats.total || 0,
          total_a_traiter: stats.total_a_traiter || 0,
          total_traites: stats.total_traites || 0,
        },
      ],
    };
  });
};

export const getEvenlySpacedDates = async (period: StatsPeriod, referenceDate: Date): Promise<Date[]> => {
  const startDate = await calculateStartDateAsync(period, referenceDate);

  const timeDiff = referenceDate.getTime() - startDate.getTime();

  if (timeDiff <= 0) {
    return [referenceDate];
  }

  const dates: Date[] = [];
  for (let i = 0; i < TIME_SERIES_POINTS_COUNT; i++) {
    const intervalTime = startDate.getTime() + (timeDiff * i) / (TIME_SERIES_POINTS_COUNT - 1);
    const date = normalizeToUTCDay(new Date(intervalTime));
    dates.push(date);
  }

  return dates;
};

type TerritoryLevel = "region" | "departement";

/** ML totales et activées par région ou par département, éventuellement restreintes à une région. */
async function getMissionLocalesByTerritory(
  evaluationDate: Date,
  startDate: Date,
  level: TerritoryLevel,
  regionCode?: string
) {
  return (await organisationsDb()
    .aggregate([
      { $match: { type: "MISSION_LOCALE", ...(regionCode ? { "adresse.region": regionCode } : {}) } },
      {
        $group: {
          _id: `$adresse.${level}`,
          ml_total: { $sum: 1 },
          ml_activees_current: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: [{ $ifNull: ["$activated_at", null] }, null] },
                    { $lte: ["$activated_at", evaluationDate] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          ml_activees_previous: {
            $sum: {
              $cond: [
                {
                  $and: [{ $ne: [{ $ifNull: ["$activated_at", null] }, null] }, { $lte: ["$activated_at", startDate] }],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      ...(level === "region"
        ? [
            { $lookup: { from: "regions", localField: "_id", foreignField: "code", as: "region_info" } },
            { $addFields: { nom: { $arrayElemAt: ["$region_info.nom", 0] } } },
          ]
        : []),
      { $sort: { ml_total: -1 } },
    ])
    .toArray()) as Array<{
    _id: string | null;
    nom?: string;
    ml_total: number;
    ml_activees_current: number;
    ml_activees_previous: number;
  }>;
}

type TerritoryStatsAtDate = { engaged: number; a_traiter: number; traites: number };

async function getTerritoryStatsAtDate(
  date: Date,
  level: TerritoryLevel,
  regionCode?: string
): Promise<Map<string | null, TerritoryStatsAtDate>> {
  const missionLocaleIds = regionCode ? await getMissionLocaleIdsByRegions([regionCode]) : undefined;
  const rows = (await missionLocaleStatsDb()
    .aggregate(
      [
        ...buildLatestPerMlStages(buildLatestStatsMatch(date, missionLocaleIds)),
        ...buildOrgLookupPipeline({ checkActivation: false, localField: "_id" }),
        { $addFields: { view: buildSegmentViewExpr("rupture") } },
        {
          $group: {
            _id: `$ml.adresse.${level}`,
            engaged: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: [{ $ifNull: ["$ml.activated_at", null] }, null] },
                      { $ne: ["$latest_stats.total", 0] },
                      { $gte: [{ $divide: ["$latest_stats.traite", "$latest_stats.total"] }, ENGAGEMENT_THRESHOLD] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            a_traiter: { $sum: "$view.a_traiter" },
            traites: { $sum: "$view.traite" },
          },
        },
      ],
      { allowDiskUse: true }
    )
    .toArray()) as Array<{ _id: string | null; engaged: number; a_traiter: number; traites: number }>;

  return new Map(
    rows.map((row) => [row._id, { engaged: row.engaged, a_traiter: row.a_traiter, traites: row.traites }])
  );
}

const EMPTY_TERRITORY_STATS: TerritoryStatsAtDate = { engaged: 0, a_traiter: 0, traites: 0 };

async function getTerritoryStats(period: StatsPeriod, level: TerritoryLevel, regionCode?: string) {
  const evaluationDate = normalizeToUTCDay(new Date());
  const startDate = await calculateStartDateAsync(period, evaluationDate);

  const [territories, currentByCode, previousByCode] = await Promise.all([
    getMissionLocalesByTerritory(evaluationDate, startDate, level, regionCode),
    getTerritoryStatsAtDate(evaluationDate, level, regionCode),
    getTerritoryStatsAtDate(startDate, level, regionCode),
  ]);

  // Une ML sans département reste visible (ligne « inconnu ») ; sans région, elle n'a pas de ligne régionale.
  return territories
    .filter((territory) => level === "departement" || territory._id != null)
    .map((territory) => {
      const current = currentByCode.get(territory._id) || EMPTY_TERRITORY_STATS;
      const previous = previousByCode.get(territory._id) || EMPTY_TERRITORY_STATS;

      return {
        code: territory._id ?? UNKNOWN_DEPARTEMENT_CODE,
        nom: territory.nom,
        ml_total: territory.ml_total,
        ml_activees: territory.ml_activees_current,
        ml_activees_delta: territory.ml_activees_current - territory.ml_activees_previous,
        ml_engagees: current.engaged,
        ml_engagees_delta: current.engaged - previous.engaged,
        engagement_rate: territory.ml_activees_current > 0 ? current.engaged / territory.ml_activees_current : 0,
        a_traiter: current.a_traiter,
        traites: current.traites,
        traites_variation: calculatePercentage(current.traites, previous.traites),
      };
    });
}

export const getRegionalStats = async (period: StatsPeriod = "30days") => {
  const territories = await getTerritoryStats(period, "region");

  return {
    regions: territories.map((territory) => ({
      ...territory,
      nom: territory.nom || "Région inconnue",
    })),
  };
};

/** Couverture par département d'une région, sur le modèle de `getRegionalStats`. */
export const getDepartementalStats = async (period: StatsPeriod = "30days", regionCode: string) => {
  const territories = await getTerritoryStats(period, "departement", regionCode);

  return {
    departements: territories.map((territory) => ({
      ...territory,
      nom: DEPARTEMENTS_BY_CODE[territory.code as keyof typeof DEPARTEMENTS_BY_CODE]?.nom || "Département inconnu",
    })),
  };
};

/** Périmètre des lecteurs : une ML explicite, sinon les ML des régions données, sinon tout. */
export const resolveMissionLocaleIds = async (regions?: string[], mlId?: string) =>
  mlId ? [new ObjectId(mlId)] : regions?.length ? await getMissionLocaleIdsByRegions(regions) : undefined;

const toTraitementStatsData = (stats: ICollabSegmentStats) => ({
  total: stats.total,
  total_contacte: stats.traite,
  total_repondu: stats.repondu,
  total_accompagne: stats.rdv_pris_decouverts,
});

export const getTraitementStats = async (
  period: StatsPeriod = "30days",
  evaluationDate: Date = normalizeToUTCDay(new Date()),
  regions?: string[],
  segment: StatsSegment = "rupture",
  mlId?: string
): Promise<ITraitementStatsResponse> => {
  const endDate = evaluationDate;
  const startDate = await calculateStartDateAsync(period, endDate);

  const missionLocaleIds = await resolveMissionLocaleIds(regions, mlId);

  const [latest, first] = await Promise.all([
    getSegmentStatsForPeriod(endDate, missionLocaleIds, segment),
    getFirstSegmentStatsInPeriod(startDate, endDate, missionLocaleIds, segment),
  ]);

  return {
    latest: toTraitementStatsData(latest),
    first: toTraitementStatsData(first),
    evaluationDate: endDate,
    period,
    segment,
  };
};

interface TraitementMLParams {
  period: StatsPeriod;
  segment: StatsSegment;
  region?: string;
  regions?: string[];
  page: number;
  limit: number;
  sort_by: TraitementMlSortBy;
  sort_order: "asc" | "desc";
  search?: string;
  departements?: string[];
  utiliseService?: boolean;
  engagee?: boolean;
}

const TRAITEMENT_ML_SORT_FIELD_MAP: Record<TraitementMlSortBy, string> = {
  nom: "nom",
  total_jeunes: "total_jeunes",
  a_traiter: "a_traiter",
  traites: "traites",
  pourcentage_traites: "pourcentage_traites",
  derniere_activite: "derniere_activite",
  jours_depuis_activite: "jours_depuis_activite_sort",
  delai_moyen_jours: "delai_moyen_jours_sort",
};

const buildPourcentageTraitesExpr = (viewPath: string) => {
  const totalJeunes = { $add: [`${viewPath}.a_traiter`, `${viewPath}.traite`] };
  return {
    $cond: [{ $eq: [totalJeunes, 0] }, 0, { $multiply: [{ $divide: [`${viewPath}.traite`, totalJeunes] }, 100] }],
  };
};

const buildTranchesProjection = (viewPath: string) => ({
  rdv_pris: `${viewPath}.rdv_pris`,
  projet_pro_securise: `${viewPath}.projet_pro_securise`,
  ne_souhaite_pas_accompagnement: `${viewPath}.ne_souhaite_pas_accompagnement`,
  a_recontacter: `${viewPath}.a_recontacter`,
  injoignable: `${viewPath}.injoignable`,
  autre: `${viewPath}.autre`,
});

export const getTraitementStatsByMissionLocale = async (
  params: TraitementMLParams
): Promise<ITraitementMLStatsResponse> => {
  const {
    period,
    segment,
    region,
    regions,
    page,
    limit,
    sort_by,
    sort_order,
    search,
    departements,
    utiliseService,
    engagee,
  } = params;
  const evaluationDate = normalizeToUTCDay(new Date());
  const startDate = await calculateStartDateAsync(period, evaluationDate);

  const mongoSortField = TRAITEMENT_ML_SORT_FIELD_MAP[sort_by];
  const sortDirection = sort_order === "desc" ? -1 : 1;
  const skip = (page - 1) * limit;

  const regionFilter = region
    ? { "adresse.region": region }
    : regions?.length
      ? { "adresse.region": { $in: regions } }
      : {};

  const pipeline = [
    {
      $match: {
        type: "MISSION_LOCALE",
        ...regionFilter,
        ...(departements?.length && { "adresse.departement": { $in: departements } }),
        ...(search && { nom: { $regex: escapeRegex(search), $options: "i" } }),
      },
    },
    {
      $lookup: {
        from: "missionLocaleStats",
        let: { ml_id: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$mission_locale_id", "$$ml_id"] },
                  { $lte: ["$computed_day", evaluationDate] },
                  { $gte: ["$computed_day", getLatestStatsLowerBound(evaluationDate)] },
                ],
              },
            },
          },
          { $sort: { computed_day: -1 } },
          { $limit: 1 },
          { $project: { stats: 1, segments: 1 } },
        ],
        as: "latest_stats_entry",
      },
    },
    {
      $lookup: {
        from: "missionLocaleStats",
        let: { ml_id: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$mission_locale_id", "$$ml_id"] },
                  { $gte: ["$computed_day", startDate] },
                  { $lte: ["$computed_day", evaluationDate] },
                ],
              },
            },
          },
          { $sort: { computed_day: 1 } },
          { $limit: 1 },
          { $project: { stats: 1, segments: 1 } },
        ],
        as: "first_stats_entry",
      },
    },
    {
      $addFields: {
        latest_stats: { $arrayElemAt: ["$latest_stats_entry.stats", 0] },
        latest_segments: { $arrayElemAt: ["$latest_stats_entry.segments", 0] },
        first_entry: {
          $ifNull: [{ $arrayElemAt: ["$first_stats_entry", 0] }, { $arrayElemAt: ["$latest_stats_entry", 0] }],
        },
      },
    },
    {
      $addFields: {
        view: buildSegmentViewExpr(segment),
        first_view: buildSegmentViewExpr(segment, "$first_entry.stats", "$first_entry.segments"),
      },
    },
    { $unset: ["latest_stats_entry", "first_stats_entry", "first_entry"] },
    {
      $lookup: {
        from: "regions",
        localField: "adresse.region",
        foreignField: "code",
        as: "region_info",
      },
    },
    {
      $addFields: {
        total_jeunes: { $add: ["$view.a_traiter", "$view.traite"] },
        pourcentage_traites: { $round: [buildPourcentageTraitesExpr("$view"), 0] },
        first_pourcentage_traites: buildPourcentageTraitesExpr("$first_view"),
        nom: { $trim: { input: "$nom" } },
        region_code: "$adresse.region",
        region_nom: { $ifNull: [{ $arrayElemAt: ["$region_info.nom", 0] }, "Région inconnue"] },
        a_traiter: "$view.a_traiter",
        traites: "$view.traite",
        delai_moyen_jours: segment === "collab" ? buildDelaiMoyenExpr() : { $literal: null },
        is_activated: { $ne: [{ $ifNull: ["$activated_at", null] }, null] },
        is_engaged: {
          $and: [
            { $ne: [{ $ifNull: ["$activated_at", null] }, null] },
            { $gt: [{ $ifNull: ["$latest_stats.total", 0] }, 0] },
            { $gte: [{ $divide: ["$latest_stats.traite", "$latest_stats.total"] }, ENGAGEMENT_THRESHOLD] },
          ],
        },
        departement_code: "$adresse.departement",
      },
    },
    ...(utiliseService !== undefined || engagee !== undefined
      ? [
          {
            $match: {
              ...(utiliseService !== undefined && { is_activated: utiliseService }),
              ...(engagee !== undefined && { is_engaged: engagee }),
            },
          },
        ]
      : []),
    {
      $addFields: {
        delai_moyen_jours_sort: {
          $ifNull: ["$delai_moyen_jours", sortDirection === 1 ? Number.MAX_SAFE_INTEGER : -1],
        },
        jours_depuis_activite_sort: {
          $cond: [
            { $eq: [{ $ifNull: ["$derniere_activite", null] }, null] },
            -9999999,
            {
              $multiply: [
                -1,
                {
                  $floor: {
                    $divide: [{ $subtract: [evaluationDate, "$derniere_activite"] }, 1000 * 60 * 60 * 24],
                  },
                },
              ],
            },
          ],
        },
        jours_depuis_activite: {
          $cond: [
            { $eq: [{ $ifNull: ["$derniere_activite", null] }, null] },
            null,
            {
              $floor: {
                $divide: [{ $subtract: [evaluationDate, "$derniere_activite"] }, 1000 * 60 * 60 * 24],
              },
            },
          ],
        },
      },
    },
    {
      $facet: {
        total: [{ $count: "count" }],
        data: [
          { $sort: { [mongoSortField]: sortDirection, nom: 1 } as Record<string, 1 | -1> },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              id: { $toString: "$_id" },
              nom: 1,
              region_code: 1,
              region_nom: 1,
              total_jeunes: 1,
              a_traiter: 1,
              traites: 1,
              pourcentage_traites: 1,
              is_activated: 1,
              is_engaged: 1,
              departement_code: 1,
              details: buildTranchesProjection("$view"),
              delai_moyen_jours: 1,
              derniere_activite: { $ifNull: ["$derniere_activite", null] },
              jours_depuis_activite: 1,
              pourcentage_evolution_value: {
                $round: [{ $subtract: ["$pourcentage_traites", "$first_pourcentage_traites"] }, 0],
              },
            },
          },
        ],
      },
    },
  ];

  const [result] = await organisationsDb().aggregate(pipeline, { allowDiskUse: true }).toArray();

  const total = result.total[0]?.count || 0;
  const data = result.data || [];

  const resultsWithEvolution = data.map((item: Record<string, unknown>) => {
    const evolutionValue = (item.pourcentage_evolution_value as number) || 0;
    let pourcentage_evolution = "=";
    if (evolutionValue > 0) {
      pourcentage_evolution = `+${evolutionValue}%`;
    } else if (evolutionValue < 0) {
      pourcentage_evolution = `${evolutionValue}%`;
    }

    const { pourcentage_evolution_value: _pourcentage_evolution_value, ...rest } = item;
    return {
      ...rest,
      pourcentage_evolution,
    } as ITraitementMLStatsResponse["data"][number];
  });

  return {
    data: resultsWithEvolution,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    period,
    segment,
  };
};

export const getSuiviTraitementByRegion = async (segment: StatsSegment = "all"): Promise<ITraitementRegionStats[]> => {
  const evaluationDate = normalizeToUTCDay(new Date());

  const pipeline = [
    ...buildLatestPerMlStages(buildLatestStatsMatch(evaluationDate)),
    { $addFields: { view: buildSegmentViewExpr(segment) } },
    ...buildOrgLookupPipeline({ checkActivation: false, localField: "_id" }),
    {
      $group: {
        _id: "$ml.adresse.region",
        a_traiter: { $sum: "$view.a_traiter" },
        traites: { $sum: "$view.traite" },
        ml_actives: {
          $sum: {
            $cond: [{ $ne: [{ $ifNull: ["$ml.activated_at", null] }, null] }, 1, 0],
          },
        },
      },
    },
    { $match: { _id: { $ne: null } } },
    ...buildRegionLookupPipeline(),
    {
      $project: {
        code: "$_id",
        nom: 1,
        a_traiter: 1,
        traites: 1,
        total_jeunes: { $add: ["$a_traiter", "$traites"] },
        pourcentage_traites: buildPercentageExpression("$traites", { $add: ["$a_traiter", "$traites"] }),
        ml_actives: 1,
      },
    },
    { $sort: { pourcentage_traites: -1 as const, nom: 1 as const } },
  ];

  const results = await missionLocaleStatsDb().aggregate(pipeline, { allowDiskUse: true }).toArray();

  return results.map((r) => ({
    code: r.code,
    nom: r.nom,
    total_jeunes: r.total_jeunes,
    a_traiter: r.a_traiter,
    traites: r.traites,
    pourcentage_traites: r.pourcentage_traites,
    ml_actives: r.ml_actives,
  }));
};

const buildCountIf = (field: string, value: string) => ({
  $sum: { $cond: [{ $eq: [field, value] }, 1, 0] },
});

export const DEFAULT_MOTIFS = {
  mobilite: 0,
  logement: 0,
  sante: 0,
  finance: 0,
  administratif: 0,
  social_familial: 0,
  reorientation: 0,
  recherche_emploi: 0,
  autre: 0,
};

export const MOTIFS_PIPELINE = [
  { $unwind: { path: "$organisme_data.motif", preserveNullAndEmptyArrays: true } },
  {
    $group: {
      _id: null,
      mobilite: buildCountIf("$organisme_data.motif", "MOBILITE"),
      logement: buildCountIf("$organisme_data.motif", "LOGEMENT"),
      sante: buildCountIf("$organisme_data.motif", "SANTE"),
      finance: buildCountIf("$organisme_data.motif", "FINANCE"),
      administratif: buildCountIf("$organisme_data.motif", "ADMINISTRATIF"),
      social_familial: buildCountIf("$organisme_data.motif", "SOCIAL_FAMILIAL"),
      reorientation: buildCountIf("$organisme_data.motif", "REORIENTATION"),
      recherche_emploi: buildCountIf("$organisme_data.motif", "RECHERCHE_EMPLOI"),
      autre: buildCountIf("$organisme_data.motif", "AUTRE"),
    },
  },
];

export async function getDeploymentStats(period: StatsPeriod = "30days", scopeRegions?: string[]) {
  const evaluationDate = normalizeToUTCDay(new Date());

  const scope = scopeRegions?.length ? scopeRegions : undefined;
  const [summary, regional] = await Promise.all([
    scope ? null : getSummaryStats(evaluationDate, period),
    getRegionalStats(period),
  ]);

  const regions = scope ? regional.regions.filter((r) => scope.includes(r.code)) : regional.regions;

  const engagedMlCount = regions.reduce((sum, r) => sum + r.ml_engagees, 0);
  const previousEngagedMlCount = regions.reduce((sum, r) => sum + (r.ml_engagees - r.ml_engagees_delta), 0);

  // Le national passe par getSummaryStats pour compter aussi les ML sans région.
  const mlCounts = !summary
    ? {
        mlCount: regions.reduce((sum, r) => sum + r.ml_total, 0),
        activatedMlCount: regions.reduce((sum, r) => sum + r.ml_activees, 0),
        previousActivatedMlCount: regions.reduce((sum, r) => sum + (r.ml_activees - r.ml_activees_delta), 0),
      }
    : {
        mlCount: summary.mlCount,
        activatedMlCount: summary.activatedMlCount,
        previousActivatedMlCount: summary.previousActivatedMlCount,
      };

  return {
    summary: {
      ...mlCounts,
      engagedMlCount,
      previousEngagedMlCount,
      date: evaluationDate,
    },
    regionsActives: regions.map((r) => r.code),
    evaluationDate,
    period,
  };
}

export async function getSyntheseRegionsStats(period: StatsPeriod = "30days", scopeRegions?: string[]) {
  const regional = await getRegionalStats(period);

  return {
    regions: scopeRegions?.length ? regional.regions.filter((r) => scopeRegions.includes(r.code)) : regional.regions,
    period,
  };
}

export async function getRupturantsStats(
  period: StatsPeriod = "30days",
  regions?: string[],
  mlId?: string,
  segment: StatsSegment = "rupture"
) {
  const evaluationDate = normalizeToUTCDay(new Date());
  const endDate = evaluationDate;
  const startDate = await calculateStartDateAsync(period, endDate);

  const missionLocaleIds = await resolveMissionLocaleIds(regions, mlId);

  const evenlySpacedDates = await getEvenlySpacedDates(period, endDate);
  const rupturantsTimeSeries: ITimeSeriesPoint[] = await getCumulativeStatsForDates(
    evenlySpacedDates,
    missionLocaleIds,
    segment
  );

  const [currentStats, previousStats] = await Promise.all([
    getSegmentStatsForPeriod(endDate, missionLocaleIds, segment),
    getSegmentStatsForPeriod(startDate, missionLocaleIds, segment),
  ]);

  const rupturantsSummary: IRupturantsSummary = {
    a_traiter: createStatWithVariation(currentStats.a_traiter, previousStats.a_traiter),
    traites: createStatWithVariation(currentStats.traite, previousStats.traite),
    total: currentStats.total,
  };

  return {
    timeSeries: rupturantsTimeSeries,
    summary: rupturantsSummary,
    evaluationDate,
    period,
    segment,
  };
}

const buildDetailsTraitesV2 = (
  current: ICollabSegmentStats,
  previous: ICollabSegmentStats
): IDetailsDossiersTraitesV2 => ({
  rdv_pris: createStatWithVariation(current.rdv_pris, previous.rdv_pris),
  projet_pro_securise: createStatWithVariation(current.projet_pro_securise, previous.projet_pro_securise),
  ne_souhaite_pas_accompagnement: createStatWithVariation(
    current.ne_souhaite_pas_accompagnement,
    previous.ne_souhaite_pas_accompagnement
  ),
  a_recontacter: createStatWithVariation(current.a_recontacter, previous.a_recontacter),
  injoignable: createStatWithVariation(current.injoignable, previous.injoignable),
  autre: createStatWithVariation(current.autre, previous.autre),
  total: current.traite,
});

export async function getDossiersTraitesStats(
  period: StatsPeriod = "30days",
  regions?: string[],
  mlId?: string,
  segment: StatsSegment = "rupture"
): Promise<IDossiersTraitesStatsResponse> {
  const evaluationDate = normalizeToUTCDay(new Date());
  const endDate = evaluationDate;
  const startDate = await calculateStartDateAsync(period, endDate);

  const missionLocaleIds = await resolveMissionLocaleIds(regions, mlId);

  const [currentStats, previousStats] = await Promise.all([
    getSegmentStatsForPeriod(endDate, missionLocaleIds, segment),
    getSegmentStatsForPeriod(startDate, missionLocaleIds, segment),
  ]);

  return {
    detailsV2: buildDetailsTraitesV2(currentStats, previousStats),
    traites: currentStats.traite,
    deja_connu_accompagne: segment === "all" ? null : currentStats.deja_connu_accompagne,
    evaluationDate,
    period,
    segment,
  };
}

export const buildCollabMatch = (date: Date, missionLocaleIds?: ObjectId[]) => ({
  "organisme_data.acc_conjoint": true,
  "organisme_data.acc_conjoint_at": { $lte: date },
  soft_deleted: { $ne: true },
  ...(missionLocaleIds ? { mission_locale_id: { $in: missionLocaleIds } } : {}),
});

/**
 * Périmètre des dossiers de collaboration : ceux reçus par la ML d'une fiche, sinon ceux envoyés par les CFA du
 * territoire, quelle que soit la région de la ML qui les reçoit (décision 1.1).
 */
export const buildCollabPerimetreMatch = async (
  regions?: string[],
  mlId?: string
): Promise<Record<string, unknown>> => {
  if (mlId) return { mission_locale_id: new ObjectId(mlId) };
  if (!regions?.length) return {};
  const organismeIds = await organismesDb().distinct("_id", { "adresse.region": { $in: regions } });
  return { "effectif_snapshot.organisme_id": { $in: organismeIds } };
};

/** Chiffres clés des collaborations d'une ML, à partir de ses snapshots (les territoires passent par les CFA). */
export async function getCollaborationSegmentStats(
  period: StatsPeriod = "30days",
  regions?: string[],
  mlId?: string
): Promise<ICollaborationSegmentStats> {
  const evaluationDate = normalizeToUTCDay(new Date());
  const startDate = await calculateStartDateAsync(period, evaluationDate);
  const missionLocaleIds = await resolveMissionLocaleIds(regions, mlId);
  const { nesApres, nesAvant } = getBornesNaissanceMissionLocale();
  const collabMatch = (date: Date) => ({
    ...buildCollabMatch(date, missionLocaleIds),
    "effectif_snapshot.apprenant.date_de_naissance": { $gte: nesApres, $lte: nesAvant },
  });

  const countCfaAyantCollabore = async (date: Date) =>
    (await missionLocaleEffectifsDb().distinct("effectif_snapshot.organisme_id", collabMatch(date))).length;

  const [current, previous, cfaCurrent, cfaPrevious, objectifsResult] = await Promise.all([
    getSegmentStatsForPeriod(evaluationDate, missionLocaleIds, "collab"),
    getSegmentStatsForPeriod(startDate, missionLocaleIds, "collab"),
    countCfaAyantCollabore(evaluationDate),
    countCfaAyantCollabore(startDate),
    missionLocaleEffectifsDb()
      .aggregate([
        { $match: collabMatch(evaluationDate) },
        { $facet: { motifs: MOTIFS_PIPELINE, total: [{ $count: "count" }] } },
      ])
      .next(),
  ]);

  const motifs = { ...DEFAULT_MOTIFS, ...objectifsResult?.motifs?.[0] };
  const situations = {
    rupture: current.situation_rupture,
    abandon: current.situation_abandon,
    prevention_inevitable: current.situation_prevention_inevitable,
    prevention_tres_eleve: current.situation_prevention_tres_eleve,
    prevention_modere: current.situation_prevention_modere,
    besoin_aide_hors_rupture: current.situation_besoin_aide_hors_rupture,
  };

  return {
    evaluationDate,
    period,
    cfa_ayant_collabore: createStatWithVariation(cfaCurrent, cfaPrevious),
    jeunes_envoyes: createStatWithVariation(current.total, previous.total),
    jeunes_contactes: createStatWithVariation(current.traite, previous.traite),
    jeunes_accompagnement_accepte: createStatWithVariation(current.rdv_pris, previous.rdv_pris),
    resultats: buildDetailsTraitesV2(current, previous),
    part_deja_connus: current.traite > 0 ? Math.round((current.deja_connu_accompagne / current.traite) * 100) : 0,
    delai_moyen_jours:
      current.delai_premiere_activite_count > 0
        ? Math.round((current.delai_premiere_activite_jours_total / current.delai_premiere_activite_count) * 10) / 10
        : null,
    situations: { ...situations, total: Object.values(situations).reduce((sum, value) => sum + value, 0) },
    situations_variations: {
      rupture: createStatWithVariation(current.situation_rupture, previous.situation_rupture).variation,
      abandon: createStatWithVariation(current.situation_abandon, previous.situation_abandon).variation,
      prevention_inevitable: createStatWithVariation(
        current.situation_prevention_inevitable,
        previous.situation_prevention_inevitable
      ).variation,
      prevention_tres_eleve: createStatWithVariation(
        current.situation_prevention_tres_eleve,
        previous.situation_prevention_tres_eleve
      ).variation,
      prevention_modere: createStatWithVariation(
        current.situation_prevention_modere,
        previous.situation_prevention_modere
      ).variation,
      besoin_aide_hors_rupture: createStatWithVariation(
        current.situation_besoin_aide_hors_rupture,
        previous.situation_besoin_aide_hors_rupture
      ).variation,
    },
    objectifs: {
      mobilite: motifs.mobilite || 0,
      logement: motifs.logement || 0,
      sante: motifs.sante || 0,
      finance: motifs.finance || 0,
      administratif: motifs.administratif || 0,
      social_familial: motifs.social_familial || 0,
      reorientation: motifs.reorientation || 0,
      recherche_emploi: motifs.recherche_emploi || 0,
      autre: motifs.autre || 0,
      total_dossiers: objectifsResult?.total?.[0]?.count || 0,
    },
  };
}

const PARIS_TIMEZONE = "Europe/Paris";

const toMonthKey = (date: Date) =>
  new Intl.DateTimeFormat("fr-CA", { timeZone: PARIS_TIMEZONE, year: "numeric", month: "2-digit" }).format(date);

const listMonthKeys = (fromKey: string, to: Date) => {
  const toIndex = (monthKey: string) => {
    const [year, month] = monthKey.split("-").map(Number);
    return year * 12 + month - 1;
  };
  const keys: string[] = [];
  for (let index = toIndex(fromKey); index <= toIndex(toMonthKey(to)); index++) {
    keys.push(`${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`);
  }
  return keys;
};

/** Cohortes mensuelles : dossiers envoyés chaque mois, puis ceux contactés et ceux ayant accepté à ce jour. */
export async function getCollaborationMensuelStats(
  period: StatsPeriod = "30days",
  regions?: string[],
  mlId?: string,
  organismeId?: ObjectId
): Promise<ICollaborationMensuelStats> {
  const now = new Date();
  // Fiche CFA et « depuis le lancement » : l'évolution part du premier dossier envoyé, sans mois vides avant.
  const debutPeriode =
    organismeId || period === "all" ? null : await calculateStartDateAsync(period, normalizeToUTCDay(now));
  const perimetre = organismeId
    ? { "effectif_snapshot.organisme_id": organismeId }
    : await buildCollabPerimetreMatch(regions, mlId);

  const rows = await missionLocaleEffectifsDb()
    .aggregate<ICollaborationMois>([
      {
        $match: { ...buildCollabMatch(now), ...perimetre },
      },
      {
        $addFields: {
          mois: {
            $dateToString: { format: "%Y-%m", date: "$organisme_data.acc_conjoint_at", timezone: PARIS_TIMEZONE },
          },
        },
      },
      ...(debutPeriode ? [{ $match: { mois: { $gte: toMonthKey(debutPeriode) } } }] : []),
      {
        $group: {
          _id: "$mois",
          envoyes: { $sum: 1 },
          contactes: { $sum: { $cond: [{ $ifNull: ["$situation", false] }, 1, 0] } },
          acceptes: { $sum: { $cond: [{ $eq: ["$situation", SITUATION_ENUM.RDV_PRIS] }, 1, 0] } },
        },
      },
      { $project: { _id: 0, mois: "$_id", envoyes: 1, contactes: 1, acceptes: 1 } },
    ])
    .toArray();

  const premierMois = debutPeriode ? toMonthKey(debutPeriode) : rows.map((row) => row.mois).sort()[0];
  const monthKeys = premierMois ? listMonthKeys(premierMois, now) : [toMonthKey(now)];
  const byMonth = new Map(rows.map((row) => [row.mois, row]));
  return {
    mois: monthKeys.map((mois) => byMonth.get(mois) ?? { mois, envoyes: 0, contactes: 0, acceptes: 0 }),
    period,
  };
}

export async function getCouvertureRegionsStats(period: StatsPeriod = "30days") {
  const regional = await getRegionalStats(period);

  return {
    regions: regional.regions,
    period,
  };
}

interface TraitementExportParams {
  regions?: string[];
  mlId?: string;
}

const buildPercentageField = (numerator: string, denominator: string) => ({
  $round: [
    {
      $cond: [
        { $eq: [`$${denominator}`, 0] },
        0,
        { $multiply: [{ $divide: [`$${numerator}`, `$${denominator}`] }, 100] },
      ],
    },
    1,
  ],
});

const buildExportBasePipeline = (evaluationDate: Date, regions?: string[], mlId?: string) => [
  ...buildLatestPerMlStages(buildLatestStatsMatch(evaluationDate, mlId ? [new ObjectId(mlId)] : undefined)),
  { $lookup: { from: "organisations", localField: "_id", foreignField: "_id", as: "ml" } },
  { $unwind: "$ml" },
  {
    $match: {
      "ml.type": "MISSION_LOCALE",
      ...(regions?.length && { "ml.adresse.region": { $in: regions } }),
    },
  },
];

const buildPercentageProjections = () => ({
  pourcentage_traites: buildPercentageField("traites", "total_jeunes"),
  pourcentage_a_recontacter: buildPercentageField("contacte_sans_retour", "traites"),
  pourcentage_rdv_pris: buildPercentageField("rdv_pris", "traites"),
  pourcentage_connu_ml: buildPercentageField("deja_connu", "traites"),
});

const buildDetailFieldsProjection = () => ({
  rdv_pris: 1,
  nouveau_projet: 1,
  contacte_sans_retour: 1,
  injoignables: 1,
  coordonnees_incorrectes: 1,
  autre_avec_contact: 1,
  cherche_contrat: 1,
  reorientation: 1,
  ne_veut_pas_accompagnement: 1,
});

const buildSegmentRowsPipeline = (basePipeline: Record<string, unknown>[], segment: "rupture" | "collab") => [
  ...basePipeline,
  { $lookup: { from: "regions", localField: "ml.adresse.region", foreignField: "code", as: "region_info" } },
  { $addFields: { view: buildSegmentViewExpr(segment) } },
  {
    $project: {
      region_nom: { $ifNull: [{ $arrayElemAt: ["$region_info.nom", 0] }, "Région inconnue"] },
      departement_code: { $ifNull: ["$ml.adresse.departement", null] },
      nom: { $trim: { input: "$ml.nom" } },
      siret: { $ifNull: ["$ml.siret", null] },
      date_activation: { $ifNull: ["$ml.activated_at", null] },
      derniere_activite: { $ifNull: ["$ml.derniere_activite", null] },
      total_jeunes: { $add: ["$view.a_traiter", "$view.traite"] },
      a_traiter: "$view.a_traiter",
      traites: "$view.traite",
      pourcentage_traites: { $round: [buildPourcentageTraitesExpr("$view"), 1] },
      repondu: "$view.repondu",
      rdv_pris: "$view.rdv_pris",
      rdv_pris_decouverts: "$view.rdv_pris_decouverts",
      projet_pro_securise: "$view.projet_pro_securise",
      ne_souhaite_pas_accompagnement: "$view.ne_souhaite_pas_accompagnement",
      a_recontacter: "$view.a_recontacter",
      injoignable: "$view.injoignable",
      autre: "$view.autre",
      deja_connu_accompagne: "$view.deja_connu_accompagne",
      ...(segment === "collab"
        ? {
            situation_rupture: "$view.situation_rupture",
            situation_abandon: "$view.situation_abandon",
            situation_prevention_inevitable: "$view.situation_prevention_inevitable",
            situation_prevention_tres_eleve: "$view.situation_prevention_tres_eleve",
            situation_prevention_modere: "$view.situation_prevention_modere",
            situation_besoin_aide_hors_rupture: "$view.situation_besoin_aide_hors_rupture",
            delai_moyen_jours: buildDelaiMoyenExpr(),
          }
        : {}),
    },
  },
  { $sort: { region_nom: 1 as const, departement_code: 1 as const, nom: 1 as const } },
];

const withDepartementNom = <T extends { departement_code: string | null }>(row: T) => {
  const departement = row.departement_code
    ? DEPARTEMENTS_BY_CODE[row.departement_code as keyof typeof DEPARTEMENTS_BY_CODE]
    : null;
  return { ...row, departement_nom: departement?.nom ?? "Département inconnu" };
};

export const getTraitementExportData = async (params: TraitementExportParams) => {
  const { regions, mlId } = params;
  const evaluationDate = normalizeToUTCDay(new Date());

  const basePipeline = buildExportBasePipeline(evaluationDate, regions, mlId);

  const mlPipeline = [
    ...basePipeline,
    { $lookup: { from: "regions", localField: "ml.adresse.region", foreignField: "code", as: "region_info" } },
    {
      $addFields: {
        total_jeunes: { $add: ["$latest_stats.a_traiter", "$latest_stats.traite"] },
        traites: buildTotalTraitesV2Expression(),
        a_traiter: "$latest_stats.a_traiter",
        rdv_pris: { $ifNull: ["$latest_stats.rdv_pris", 0] },
        nouveau_projet: { $ifNull: ["$latest_stats.nouveau_projet", 0] },
        contacte_sans_retour: { $ifNull: ["$latest_stats.contacte_sans_retour", 0] },
        injoignables: { $ifNull: ["$latest_stats.injoignables", 0] },
        coordonnees_incorrectes: { $ifNull: ["$latest_stats.coordonnees_incorrectes", 0] },
        autre_avec_contact: { $ifNull: ["$latest_stats.autre_avec_contact", 0] },
        cherche_contrat: { $ifNull: ["$latest_stats.cherche_contrat", 0] },
        reorientation: { $ifNull: ["$latest_stats.reorientation", 0] },
        ne_veut_pas_accompagnement: { $ifNull: ["$latest_stats.ne_veut_pas_accompagnement", 0] },
        deja_connu: { $ifNull: ["$latest_stats.deja_connu", 0] },
        derniere_activite: { $ifNull: ["$ml.derniere_activite", null] },
      },
    },
    {
      $project: {
        region_nom: { $ifNull: [{ $arrayElemAt: ["$region_info.nom", 0] }, "Région inconnue"] },
        departement_code: { $ifNull: ["$ml.adresse.departement", null] },
        nom: { $trim: { input: "$ml.nom" } },
        siret: { $ifNull: ["$ml.siret", null] },
        total_jeunes: 1,
        a_traiter: 1,
        traites: 1,
        ...buildPercentageProjections(),
        date_activation: { $ifNull: ["$ml.activated_at", null] },
        derniere_activite: 1,
        ...buildDetailFieldsProjection(),
      },
    },
    { $sort: { region_nom: 1 as const, departement_code: 1 as const, nom: 1 as const } },
  ];

  const regionPipeline = [
    ...basePipeline,
    { $addFields: { derniere_activite_ml: { $ifNull: ["$ml.derniere_activite", null] } } },
    {
      $group: {
        _id: "$ml.adresse.region",
        total_jeunes: { $sum: { $add: ["$latest_stats.a_traiter", "$latest_stats.traite"] } },
        a_traiter: { $sum: "$latest_stats.a_traiter" },
        traites: { $sum: buildTotalTraitesV2Expression() },
        rdv_pris: { $sum: { $ifNull: ["$latest_stats.rdv_pris", 0] } },
        nouveau_projet: { $sum: { $ifNull: ["$latest_stats.nouveau_projet", 0] } },
        contacte_sans_retour: { $sum: { $ifNull: ["$latest_stats.contacte_sans_retour", 0] } },
        injoignables: { $sum: { $ifNull: ["$latest_stats.injoignables", 0] } },
        coordonnees_incorrectes: { $sum: { $ifNull: ["$latest_stats.coordonnees_incorrectes", 0] } },
        autre_avec_contact: { $sum: { $ifNull: ["$latest_stats.autre_avec_contact", 0] } },
        cherche_contrat: { $sum: { $ifNull: ["$latest_stats.cherche_contrat", 0] } },
        reorientation: { $sum: { $ifNull: ["$latest_stats.reorientation", 0] } },
        ne_veut_pas_accompagnement: { $sum: { $ifNull: ["$latest_stats.ne_veut_pas_accompagnement", 0] } },
        deja_connu: { $sum: { $ifNull: ["$latest_stats.deja_connu", 0] } },
        ml_actives: { $sum: 1 },
        derniere_activite: { $max: "$derniere_activite_ml" },
      },
    },
    { $match: { _id: { $ne: null } } },
    ...buildRegionLookupPipeline(),
    {
      $project: {
        region_nom: "$nom",
        total_jeunes: 1,
        a_traiter: 1,
        traites: 1,
        ...buildPercentageProjections(),
        ml_actives: 1,
        derniere_activite: 1,
        ...buildDetailFieldsProjection(),
      },
    },
    { $sort: { region_nom: 1 as const } },
  ];

  const collabMissionLocaleIds = await resolveMissionLocaleIds(regions, mlId);
  const collabMlFilter = collabMissionLocaleIds ? { mission_locale_id: { $in: collabMissionLocaleIds } } : {};

  const collabByMlPipeline = [
    {
      $match: {
        "organisme_data.acc_conjoint": true,
        soft_deleted: { $ne: true },
        ...collabMlFilter,
      },
    },
    {
      $group: {
        _id: "$mission_locale_id",
        collab_total: { $sum: 1 },
        collab_non_traite: {
          $sum: { $cond: [{ $eq: [{ $ifNull: ["$situation", null] }, null] }, 1, 0] },
        },
        collab_traite: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: [{ $ifNull: ["$situation", null] }, null] },
                  { $ne: ["$situation", "CONTACTE_SANS_RETOUR"] },
                ],
              },
              1,
              0,
            ],
          },
        },
        collab_a_recontacter: { $sum: { $cond: [{ $eq: ["$situation", "CONTACTE_SANS_RETOUR"] }, 1, 0] } },
      },
    },
  ];

  const [mlDataRaw, regionData, collabData, rowsRuptureRaw, rowsCollabRaw] = await Promise.all([
    missionLocaleStatsDb().aggregate(mlPipeline, { allowDiskUse: true }).toArray(),
    missionLocaleStatsDb().aggregate(regionPipeline, { allowDiskUse: true }).toArray(),
    missionLocaleEffectifsDb().aggregate(collabByMlPipeline).toArray(),
    missionLocaleStatsDb()
      .aggregate<Omit<ISegmentExportRow, "departement_nom">>(buildSegmentRowsPipeline(basePipeline, "rupture"), {
        allowDiskUse: true,
      })
      .toArray(),
    missionLocaleStatsDb()
      .aggregate<Omit<ICollabSegmentExportRow, "departement_nom">>(buildSegmentRowsPipeline(basePipeline, "collab"), {
        allowDiskUse: true,
      })
      .toArray(),
  ]);

  const collabByMl = new Map(collabData.map((c) => [c._id.toString(), c]));

  const mlData = mlDataRaw.map((ml) => {
    const deptCode = ml.departement_code as string | null;
    const departement = deptCode ? DEPARTEMENTS_BY_CODE[deptCode as keyof typeof DEPARTEMENTS_BY_CODE] : null;
    const collab = collabByMl.get(ml._id.toString());
    return {
      ...ml,
      departement_nom: departement?.nom ?? "Département inconnu",
      collab_total: collab?.collab_total ?? 0,
      collab_non_traite: collab?.collab_non_traite ?? 0,
      collab_traite: collab?.collab_traite ?? 0,
      collab_a_recontacter: collab?.collab_a_recontacter ?? 0,
    };
  });

  const collabByRegion = new Map<
    string,
    { total: number; non_traite: number; traite: number; a_recontacter: number }
  >();
  for (const ml of mlDataRaw) {
    const regionNom = ml.region_nom as string;
    const collab = collabByMl.get(ml._id.toString());
    if (!collab) continue;
    const existing = collabByRegion.get(regionNom) ?? { total: 0, non_traite: 0, traite: 0, a_recontacter: 0 };
    existing.total += collab.collab_total ?? 0;
    existing.non_traite += collab.collab_non_traite ?? 0;
    existing.traite += collab.collab_traite ?? 0;
    existing.a_recontacter += collab.collab_a_recontacter ?? 0;
    collabByRegion.set(regionNom, existing);
  }

  const regionDataWithCollab = regionData.map((r) => {
    const collab = collabByRegion.get(r.region_nom as string);
    return {
      ...r,
      collab_total: collab?.total ?? 0,
      collab_non_traite: collab?.non_traite ?? 0,
      collab_traite: collab?.traite ?? 0,
      collab_a_recontacter: collab?.a_recontacter ?? 0,
    };
  });

  return {
    mlData,
    regionData: mlId ? [] : regionDataWithCollab,
    rows_rupture: rowsRuptureRaw.map(withDepartementNom),
    rows_collab: rowsCollabRaw.map(withDepartementNom),
    exportDate: evaluationDate,
  };
};

export const getWhatsAppStats = async (period: StatsPeriod = "all") => {
  const evaluationDate = normalizeToUTCDay(new Date());
  const startDate = await calculateStartDateAsync(period, evaluationDate);

  const matchFilter: Record<string, unknown> = {
    "whatsapp_contact.last_message_sent_at": { $exists: true, $ne: null },
  };

  if (period !== "all") {
    matchFilter["whatsapp_contact.last_message_sent_at"] = {
      $gte: startDate,
      $lte: evaluationDate,
    };
  }

  const pipeline = [
    { $match: matchFilter },
    {
      $facet: {
        totalSent: [{ $count: "count" }],
        responses: [
          {
            $match: {
              "whatsapp_contact.user_response": { $in: ["callback", "no_help"] },
            },
          },
          {
            $group: {
              _id: "$whatsapp_contact.user_response",
              count: { $sum: 1 },
            },
          },
        ],
        callbackOutcomes: [
          { $match: { whatsapp_callback_requested: true } },
          { $group: { _id: "$situation", count: { $sum: 1 } } },
        ],
        optOuts: [{ $match: { "whatsapp_contact.opted_out": true } }, { $count: "count" }],
        failed: [{ $match: { "whatsapp_contact.message_status": "failed" } }, { $count: "count" }],
        noResponse: [
          {
            $match: {
              "whatsapp_contact.user_response": { $exists: false },
              "whatsapp_contact.opted_out": { $ne: true },
            },
          },
          { $count: "count" },
        ],
      },
    },
  ];

  const [result] = await missionLocaleEffectifsDb().aggregate(pipeline, { allowDiskUse: true }).toArray();

  const totalSent = result?.totalSent?.[0]?.count || 0;
  const callbackCount =
    result?.responses?.find((r: { _id: string; count: number }) => r._id === "callback")?.count || 0;
  const noHelpCount = result?.responses?.find((r: { _id: string; count: number }) => r._id === "no_help")?.count || 0;
  const optOutsCount = result?.optOuts?.[0]?.count || 0;
  const failedCount = result?.failed?.[0]?.count || 0;
  const noResponseCount = result?.noResponse?.[0]?.count || 0;

  const totalResponded = callbackCount + noHelpCount;
  const responseRate = totalSent > 0 ? Math.round((totalResponded / totalSent) * 100) : 0;

  const outcomesMap: Record<string, number> = {
    rdv_pris: 0,
    nouveau_projet: 0,
    deja_accompagne: 0,
    injoignable: 0,
    coordonnees_incorrect: 0,
    autre: 0,
    en_attente: 0,
  };

  const situationMapping: Record<string, string> = {
    RDV_PRIS: "rdv_pris",
    NOUVEAU_PROJET: "nouveau_projet",
    NOUVEAU_CONTRAT: "nouveau_projet",
    DEJA_ACCOMPAGNE: "deja_accompagne",
    CONTACTE_SANS_RETOUR: "en_attente",
    INJOIGNABLE_APRES_RELANCES: "injoignable",
    COORDONNEES_INCORRECT: "coordonnees_incorrect",
    AUTRE: "autre",
    NE_SOUHAITE_PAS_ETRE_RECONTACTE: "autre",
  };

  result?.callbackOutcomes?.forEach((outcome: { _id: string | null; count: number }) => {
    if (!outcome._id) {
      outcomesMap.en_attente += outcome.count;
    } else {
      const mapped = situationMapping[outcome._id];
      if (mapped) {
        outcomesMap[mapped] += outcome.count;
      } else {
        outcomesMap.autre += outcome.count;
      }
    }
  });

  const totalResponses = callbackCount + noHelpCount + optOutsCount;

  return {
    summary: {
      totalSent,
      responseRate,
      totalResponses,
      failed: failedCount,
    },
    responseDistribution: {
      callback: callbackCount,
      no_help: noHelpCount,
      no_response: noResponseCount,
      opted_out: optOutsCount,
    },
    callbackOutcomes: outcomesMap,
  };
};

/**
 * Indicateurs admin du flow préqualif WhatsApp (scope national uniquement).
 */
export const getPrequalifStats = async (period: StatsPeriod = "all"): Promise<IPrequalifStats> => {
  const evaluationDate = normalizeToUTCDay(new Date());
  const startDate = await calculateStartDateAsync(period, evaluationDate);

  const baseMatch: Record<string, unknown> = {
    "whatsapp_contact.template_type": "prequalif",
    "whatsapp_contact.last_message_sent_at": { $exists: true, $ne: null },
    soft_deleted: { $ne: true },
  };

  if (period !== "all") {
    baseMatch["whatsapp_contact.last_message_sent_at"] = { $gte: startDate, $lte: evaluationDate };
  }

  const pipeline: Record<string, unknown>[] = [{ $match: baseMatch }];

  pipeline.push({
    $facet: {
      totalSent: [{ $count: "count" }],
      sentByMode: [{ $group: { _id: "$whatsapp_contact.sent_via", count: { $sum: 1 } } }],
      responses: [
        { $match: { "whatsapp_contact.user_response": { $in: ["prequalif_yes", "prequalif_no"] } } },
        { $group: { _id: "$whatsapp_contact.user_response", count: { $sum: 1 } } },
      ],
      optedOut: [{ $match: { "whatsapp_contact.opted_out": true } }, { $count: "count" }],
      failedSend: [{ $match: { "whatsapp_contact.message_status": "failed_send" } }, { $count: "count" }],
      autoReply: [{ $match: { "whatsapp_contact.auto_reply_sent": true } }, { $count: "count" }],
      tokens: [{ $match: { "whatsapp_contact.rdv_redirect_token": { $exists: true } } }, { $count: "count" }],
      clickStats: [
        { $match: { "whatsapp_contact.rdv_redirect_token": { $exists: true } } },
        {
          $project: {
            clicksCount: { $size: { $ifNull: ["$whatsapp_contact.rdv_clicks", []] } },
            hasClick: { $gt: [{ $size: { $ifNull: ["$whatsapp_contact.rdv_clicks", []] } }, 0] },
          },
        },
        {
          $group: {
            _id: null,
            totalClicks: { $sum: "$clicksCount" },
            uniqueClickers: { $sum: { $cond: ["$hasClick", 1, 0] } },
          },
        },
      ],
    },
  });

  const [result] = await missionLocaleEffectifsDb().aggregate(pipeline, { allowDiskUse: true }).toArray();

  const totalSent: number = result?.totalSent?.[0]?.count ?? 0;
  const sentByModeMap: Record<string, number> = { backfill: 0, daily: 0 };
  for (const row of (result?.sentByMode ?? []) as Array<{ _id: string | null; count: number }>) {
    if (row._id === "backfill" || row._id === "daily") sentByModeMap[row._id] = row.count;
  }

  const yesCount: number =
    (result?.responses ?? []).find((r: { _id: string }) => r._id === "prequalif_yes")?.count ?? 0;
  const noCount: number = (result?.responses ?? []).find((r: { _id: string }) => r._id === "prequalif_no")?.count ?? 0;
  const responded = yesCount + noCount;

  const tokensGenerated: number = result?.tokens?.[0]?.count ?? 0;
  const totalClicks: number = result?.clickStats?.[0]?.totalClicks ?? 0;
  const uniqueClickers: number = result?.clickStats?.[0]?.uniqueClickers ?? 0;

  const [mlTotal, mlWithUrl] = await Promise.all([
    organisationsDb().countDocuments({ type: "MISSION_LOCALE" }),
    organisationsDb().countDocuments({ type: "MISSION_LOCALE", rdv_url: { $exists: true, $ne: null } }),
  ]);

  const optedOutCount: number = result?.optedOut?.[0]?.count ?? 0;

  return {
    period,
    volume: {
      total_sent: totalSent,
      sent_by_mode: { backfill: sentByModeMap.backfill, daily: sentByModeMap.daily },
      failed_send: result?.failedSend?.[0]?.count ?? 0,
      opted_out: optedOutCount,
    },
    responses: {
      yes_count: yesCount,
      no_count: noCount,
      no_response: Math.max(0, totalSent - responded),
      auto_reply_sent: result?.autoReply?.[0]?.count ?? 0,
      response_rate: totalSent > 0 ? Math.round((responded / totalSent) * 1000) / 10 : 0,
      yes_rate: responded > 0 ? Math.round((yesCount / responded) * 1000) / 10 : 0,
      opt_out_rate: totalSent > 0 ? Math.round((optedOutCount / totalSent) * 1000) / 10 : 0,
    },
    rdv_tracking: {
      tokens_generated: tokensGenerated,
      total_clicks: totalClicks,
      unique_clickers: uniqueClickers,
      click_rate: tokensGenerated > 0 ? Math.round((uniqueClickers / tokensGenerated) * 1000) / 10 : 0,
    },
    ml_activation: { ml_with_rdv_url: mlWithUrl, ml_total: mlTotal },
  };
};
