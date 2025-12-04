import { ObjectId } from "bson";
import { IOrganisationMissionLocale, IOrganisationOrganismeFormation } from "shared/models";
import {
  IAccompagnementConjointStats,
  IAggregatedStats,
  IDetailsDossiersTraites,
  INationalStats,
  IRupturantsSummary,
  ITimeSeriesPoint,
  ITraitementStatsResponse,
  StatsPeriod,
} from "shared/models/data/nationalStats.model";
import { normalizeToUTCDay } from "shared/utils/date";
import { calculateVariation } from "shared/utils/stats";

import logger from "@/common/logger";
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
  buildOrgLookupPipeline,
  buildPercentageExpression,
  buildRegionLookupPipeline,
  calculateStartDate,
  calculateStartDateAsync,
  createStatWithVariation,
  EMPTY_STATS,
  ENGAGEMENT_THRESHOLD,
  getMissionLocaleIdsByRegion,
  TIME_SERIES_POINTS_COUNT,
  withMissionLocaleFilter,
} from "./mission-locale-stats.helpers";
import { computeMissionLocaleStats } from "./mission-locale.actions";

export type { StatsPeriod } from "shared/models/data/nationalStats.model";

export const createOrUpdateMissionLocaleStats = async (missionLocaleId: ObjectId, date?: Date) => {
  const dateToUse = normalizeToUTCDay(date ?? new Date());

  const ml = (await getOrganisationById(missionLocaleId)) as IOrganisationMissionLocale;
  const mlStats = await computeMissionLocaleStats(ml, dateToUse);

  await missionLocaleStatsDb().findOneAndUpdate(
    {
      mission_locale_id: missionLocaleId,
      computed_day: dateToUse,
    },
    {
      $set: {
        stats: mlStats,
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

interface StatsAggregationOptions {
  includeInjoignableInContacte?: boolean;
  includeAutreAvecContactInRepondu?: boolean;
  accompagneUsesNouveauProjet?: boolean;
}

const DEFAULT_STATS_OPTIONS: StatsAggregationOptions = {
  includeInjoignableInContacte: true,
  includeAutreAvecContactInRepondu: true,
  accompagneUsesNouveauProjet: false,
};

const getLatestStatsPerML = async (
  endDate: Date,
  options: StatsAggregationOptions = DEFAULT_STATS_OPTIONS,
  missionLocaleIds?: ObjectId[]
) => {
  const opts = { ...DEFAULT_STATS_OPTIONS, ...options };

  const totalContacteAdd: string[] = [
    "$latest_stats.rdv_pris",
    "$latest_stats.nouveau_projet",
    "$latest_stats.deja_accompagne",
    "$latest_stats.contacte_sans_retour",
  ];
  if (opts.includeInjoignableInContacte) {
    totalContacteAdd.push("$injoignables");
  }

  const totalReponduAdd: string[] = [
    "$latest_stats.rdv_pris",
    "$latest_stats.nouveau_projet",
    "$latest_stats.deja_accompagne",
  ];
  if (opts.includeAutreAvecContactInRepondu) {
    totalReponduAdd.push("$autre_avec_contact");
  }

  const totalAccompagneAdd: string[] = opts.accompagneUsesNouveauProjet
    ? ["$latest_stats.rdv_pris", "$latest_stats.nouveau_projet"]
    : ["$latest_stats.rdv_pris", "$latest_stats.deja_accompagne"];

  const matchFilter = withMissionLocaleFilter({ computed_day: { $lte: endDate } }, missionLocaleIds);

  const stats = await missionLocaleStatsDb()
    .aggregate([
      { $match: matchFilter },
      { $sort: { computed_day: -1 as const } },
      {
        $group: {
          _id: "$mission_locale_id",
          latest_stats: { $first: "$stats" },
        },
      },
      {
        $addFields: {
          injoignables: { $ifNull: ["$latest_stats.injoignables", 0] },
          autre_avec_contact: { $ifNull: ["$latest_stats.autre_avec_contact", 0] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$latest_stats.total" },
          total_traites: { $sum: "$latest_stats.traite" },
          total_a_traiter: { $sum: "$latest_stats.a_traiter" },
          total_contacte: {
            $sum: {
              $add: totalContacteAdd,
            },
          },
          total_repondu: {
            $sum: {
              $add: totalReponduAdd,
            },
          },
          total_accompagne: { $sum: { $add: totalAccompagneAdd } },
          rdv_pris: { $sum: "$latest_stats.rdv_pris" },
          nouveau_projet: { $sum: "$latest_stats.nouveau_projet" },
          deja_accompagne: { $sum: "$latest_stats.deja_accompagne" },
          contacte_sans_retour: { $sum: "$latest_stats.contacte_sans_retour" },
          injoignables: { $sum: "$injoignables" },
          coordonnees_incorrectes: { $sum: "$latest_stats.coordonnees_incorrectes" },
          autre: { $sum: "$latest_stats.autre" },
          autre_avec_contact: { $sum: "$autre_avec_contact" },
          deja_connu: { $sum: "$latest_stats.deja_connu" },
        },
      },
    ])
    .toArray();

  return stats;
};

const getLatestStatsPerMLWithOptions = async (endDate: Date, missionLocaleIds?: ObjectId[]) => {
  return getLatestStatsPerML(
    endDate,
    {
      includeInjoignableInContacte: false,
      includeAutreAvecContactInRepondu: false,
      accompagneUsesNouveauProjet: true,
    },
    missionLocaleIds
  );
};

export const getCumulativeStatsForDates = async (dates: Date[], missionLocaleIds?: ObjectId[]) => {
  if (dates.length === 0) return [];

  const facetPipelines: Record<string, object[]> = {};
  dates.forEach((date, index) => {
    facetPipelines[`date_${index}`] = buildCumulativeStatsPipeline(date, missionLocaleIds);
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

async function getRegionsMissionLocales(evaluationDate: Date, startDate: Date) {
  return await organisationsDb()
    .aggregate([
      { $match: { type: "MISSION_LOCALE" } },
      {
        $group: {
          _id: "$adresse.region",
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
      {
        $lookup: {
          from: "regions",
          localField: "_id",
          foreignField: "code",
          as: "region_info",
        },
      },
      {
        $addFields: {
          nom: { $arrayElemAt: ["$region_info.nom", 0] },
        },
      },
      { $sort: { ml_total: -1 } },
    ])
    .toArray();
}

async function getEngagementStatsByRegion(evaluationDate: Date, startDate: Date) {
  const allEngagementStats = await missionLocaleStatsDb()
    .aggregate(
      [
        { $match: { computed_day: { $in: [evaluationDate, startDate] } } },
        ...buildOrgLookupPipeline({ checkActivation: true }),
        {
          $group: {
            _id: { region: "$ml.adresse.region", date: "$computed_day" },
            engaged_count: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$stats.total", 0] },
                      { $gte: [{ $divide: ["$stats.traite", "$stats.total"] }, ENGAGEMENT_THRESHOLD] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ],
      { allowDiskUse: true }
    )
    .toArray();

  const engagementByRegionDate = new Map<string, { current: number; previous: number }>();
  allEngagementStats.forEach((stat) => {
    const regionCode = stat._id.region;
    const isCurrent = stat._id.date.getTime() === evaluationDate.getTime();

    if (!engagementByRegionDate.has(regionCode)) {
      engagementByRegionDate.set(regionCode, { current: 0, previous: 0 });
    }

    const entry = engagementByRegionDate.get(regionCode)!;
    if (isCurrent) {
      entry.current = stat.engaged_count;
    } else {
      entry.previous = stat.engaged_count;
    }
  });

  return engagementByRegionDate;
}

interface RegionTraitementStats {
  _id: string;
  a_traiter: number;
  traites: number;
}

async function getTraitementStatsByPeriod(endDate: Date, startDate?: Date): Promise<RegionTraitementStats[]> {
  const matchCondition = startDate ? { $lte: endDate, $gte: startDate } : { $lte: endDate };

  return (await missionLocaleStatsDb()
    .aggregate(
      [
        { $match: { computed_day: matchCondition } },
        ...buildOrgLookupPipeline({ checkActivation: false }),
        { $sort: { computed_day: -1 as const } },
        {
          $group: {
            _id: { mission_locale_id: "$mission_locale_id", region: "$ml.adresse.region" },
            latest_day: { $first: "$computed_day" },
            a_traiter: { $first: "$stats.a_traiter" },
            traites: { $first: "$stats.traite" },
          },
        },
        {
          $group: {
            _id: "$_id.region",
            a_traiter: { $sum: "$a_traiter" },
            traites: { $sum: "$traites" },
          },
        },
      ],
      { allowDiskUse: true }
    )
    .toArray()) as RegionTraitementStats[];
}

async function getTraitementStatsByRegion(evaluationDate: Date, startDate: Date) {
  const [allTraitementStats, allTraitementStatsPrevious] = await Promise.all([
    getTraitementStatsByPeriod(evaluationDate, startDate),
    getTraitementStatsByPeriod(startDate),
  ]);

  const traitementByRegionDate = new Map<
    string,
    { current: { a_traiter: number; traites: number }; previous: { a_traiter: number; traites: number } }
  >();

  allTraitementStats.forEach((stat) => {
    const regionCode = stat._id;
    if (!traitementByRegionDate.has(regionCode)) {
      traitementByRegionDate.set(regionCode, {
        current: { a_traiter: 0, traites: 0 },
        previous: { a_traiter: 0, traites: 0 },
      });
    }
    const entry = traitementByRegionDate.get(regionCode)!;
    entry.current = { a_traiter: stat.a_traiter, traites: stat.traites };
  });

  allTraitementStatsPrevious.forEach((stat) => {
    const regionCode = stat._id;
    if (!traitementByRegionDate.has(regionCode)) {
      traitementByRegionDate.set(regionCode, {
        current: { a_traiter: 0, traites: 0 },
        previous: { a_traiter: 0, traites: 0 },
      });
    }
    const entry = traitementByRegionDate.get(regionCode)!;
    entry.previous = { a_traiter: stat.a_traiter, traites: stat.traites };
  });

  return traitementByRegionDate;
}

export const getRegionalStats = async (period: StatsPeriod = "30days") => {
  const evaluationDate = normalizeToUTCDay(new Date());
  const startDate = calculateStartDate(period, evaluationDate);

  const { DEPLOYED_REGION_CODES } = await import("shared/constants/deployedRegions");

  const [regions, engagementByRegionDate, traitementByRegionDate] = await Promise.all([
    getRegionsMissionLocales(evaluationDate, startDate),
    getEngagementStatsByRegion(evaluationDate, startDate),
    getTraitementStatsByRegion(evaluationDate, startDate),
  ]);

  const regionsWithEngagement = regions
    .filter((region) => region._id != null)
    .map((region) => {
      const engagement = engagementByRegionDate.get(region._id) || { current: 0, previous: 0 };
      const traitement = traitementByRegionDate.get(region._id) || {
        current: { a_traiter: 0, traites: 0 },
        previous: { a_traiter: 0, traites: 0 },
      };

      return {
        code: region._id,
        nom: region.nom || "Région inconnue",
        deployed: DEPLOYED_REGION_CODES.includes(region._id),
        ml_total: region.ml_total,
        ml_activees: region.ml_activees_current,
        ml_activees_delta: region.ml_activees_current - region.ml_activees_previous,
        ml_engagees: engagement.current,
        ml_engagees_delta: engagement.current - engagement.previous,
        engagement_rate: region.ml_activees_current > 0 ? engagement.current / region.ml_activees_current : 0,
        a_traiter: traitement.current.a_traiter,
        traites: traitement.current.traites,
        traites_variation: calculateVariation(traitement.current.traites, traitement.previous.traites),
      };
    });

  return {
    regions: regionsWithEngagement,
  };
};

export async function getStatsForPeriod(
  endDate: Date,
  missionLocaleIds?: ObjectId[]
): Promise<IAggregatedStats & { total_contacte: number; total_repondu: number; total_accompagne: number }> {
  try {
    const stats = await getLatestStatsPerMLWithOptions(endDate, missionLocaleIds);

    if (stats.length === 0) {
      logger.warn(`[getStatsForPeriod] Aucune donnée disponible jusqu'à ${endDate.toISOString()}`);
      return { ...EMPTY_STATS };
    }

    const currentStats = stats[0];

    return {
      total: currentStats.total || 0,
      total_a_traiter: currentStats.total_a_traiter || 0,
      total_traites: currentStats.total_traites || 0,
      rdv_pris: currentStats.rdv_pris || 0,
      nouveau_projet: currentStats.nouveau_projet || 0,
      deja_accompagne: currentStats.deja_accompagne || 0,
      contacte_sans_retour: currentStats.contacte_sans_retour || 0,
      injoignables: currentStats.injoignables || 0,
      coordonnees_incorrectes: currentStats.coordonnees_incorrectes || 0,
      autre: currentStats.autre || 0,
      deja_connu: currentStats.deja_connu || 0,
      total_contacte: currentStats.total_contacte || 0,
      total_repondu: currentStats.total_repondu || 0,
      total_accompagne: currentStats.total_accompagne || 0,
    };
  } catch (error) {
    logger.error(
      `[getStatsForPeriod] Erreur lors de la récupération des stats jusqu'à ${endDate.toISOString()}`,
      error
    );
    return { ...EMPTY_STATS };
  }
}

export const getTraitementStats = async (
  period: StatsPeriod = "30days",
  evaluationDate: Date = normalizeToUTCDay(new Date()),
  region?: string
): Promise<ITraitementStatsResponse> => {
  const endDate = evaluationDate;
  const startDate = await calculateStartDateAsync(period, endDate);

  // Récupérer les IDs des missions locales de la région si spécifiée
  const missionLocaleIds = region ? await getMissionLocaleIdsByRegion(region) : undefined;

  type TraitementStatEntry = {
    total: number;
    total_contacte: number;
    total_repondu: number;
    total_accompagne: number;
  };

  const buildTraitementPipeline = (matchFilter: object) => [
    { $match: matchFilter },
    { $sort: { computed_day: -1 as const } },
    {
      $group: {
        _id: "$mission_locale_id",
        latest_stats: { $first: "$stats" },
      },
    },
    {
      $addFields: {
        injoignables: { $ifNull: ["$latest_stats.injoignables", 0] },
        autre_avec_contact: { $ifNull: ["$latest_stats.autre_avec_contact", 0] },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$latest_stats.total" },
        total_contacte: {
          $sum: {
            $add: [
              "$latest_stats.rdv_pris",
              "$latest_stats.nouveau_projet",
              "$latest_stats.deja_accompagne",
              "$latest_stats.contacte_sans_retour",
              "$injoignables",
            ],
          },
        },
        total_repondu: {
          $sum: {
            $add: [
              "$latest_stats.rdv_pris",
              "$latest_stats.nouveau_projet",
              "$latest_stats.deja_accompagne",
              "$autre_avec_contact",
            ],
          },
        },
        total_accompagne: {
          $sum: {
            $add: ["$latest_stats.rdv_pris", "$latest_stats.deja_accompagne"],
          },
        },
      },
    },
  ];

  const latestMatchFilter = withMissionLocaleFilter({ computed_day: { $lte: endDate } }, missionLocaleIds);
  const firstMatchFilter = withMissionLocaleFilter(
    { computed_day: { $gte: startDate, $lte: endDate } },
    missionLocaleIds
  );

  const [latestStatsResult] = (await missionLocaleStatsDb()
    .aggregate(buildTraitementPipeline(latestMatchFilter))
    .toArray()) as TraitementStatEntry[];

  const [firstStatsResult] = (await missionLocaleStatsDb()
    .aggregate(buildTraitementPipeline(firstMatchFilter))
    .toArray()) as TraitementStatEntry[];

  return {
    latest: {
      total: latestStatsResult?.total || 0,
      total_contacte: latestStatsResult?.total_contacte || 0,
      total_repondu: latestStatsResult?.total_repondu || 0,
      total_accompagne: latestStatsResult?.total_accompagne || 0,
    },
    first: {
      total: firstStatsResult?.total || 0,
      total_contacte: firstStatsResult?.total_contacte || 0,
      total_repondu: firstStatsResult?.total_repondu || 0,
      total_accompagne: firstStatsResult?.total_accompagne || 0,
    },
    evaluationDate: endDate,
    period,
  };
};

export const getNationalStats = async (period: StatsPeriod = "30days"): Promise<INationalStats> => {
  const evaluationDate = normalizeToUTCDay(new Date());

  const endDate = evaluationDate;
  const startDate = await calculateStartDateAsync(period, endDate);

  const evenlySpacedDates = await getEvenlySpacedDates(period, endDate);

  const rupturantsTimeSeries: ITimeSeriesPoint[] = await getCumulativeStatsForDates(evenlySpacedDates);

  const [currentStats, previousStats, regionalData, traitementData] = await Promise.all([
    getStatsForPeriod(endDate),
    getStatsForPeriod(startDate),
    getRegionalStats(period),
    getTraitementStats(period, evaluationDate),
  ]);

  const rupturantsSummary: IRupturantsSummary = {
    a_traiter: createStatWithVariation(currentStats.total_a_traiter, previousStats.total_a_traiter),
    traites: createStatWithVariation(currentStats.total_traites, previousStats.total_traites),
    total: currentStats.total,
  };

  const detailsTraites: IDetailsDossiersTraites = {
    rdv_pris: createStatWithVariation(currentStats.rdv_pris, previousStats.rdv_pris),
    nouveau_projet: createStatWithVariation(currentStats.nouveau_projet, previousStats.nouveau_projet),
    contacte_sans_retour: createStatWithVariation(
      currentStats.contacte_sans_retour,
      previousStats.contacte_sans_retour
    ),
    deja_accompagne: createStatWithVariation(currentStats.deja_accompagne, previousStats.deja_accompagne),
    injoignables: createStatWithVariation(currentStats.injoignables, previousStats.injoignables),
    coordonnees_incorrectes: createStatWithVariation(
      currentStats.coordonnees_incorrectes,
      previousStats.coordonnees_incorrectes
    ),
    autre: createStatWithVariation(currentStats.autre, previousStats.autre),
    deja_connu: currentStats.deja_connu,
    total: currentStats.total_traites,
  };

  return {
    rupturantsTimeSeries,
    rupturantsSummary,
    detailsTraites,
    regional: regionalData,
    evaluationDate: endDate,
    period,
    traitement: {
      latest: traitementData.latest,
      first: traitementData.first,
    },
  };
};

interface TraitementMLParams {
  period: StatsPeriod;
  region?: string;
  page: number;
  limit: number;
  sort_by: string;
  sort_order: "asc" | "desc";
  search?: string;
}

export const getTraitementStatsByMissionLocale = async (params: TraitementMLParams) => {
  const { period, region, page, limit, sort_by, sort_order, search } = params;
  const evaluationDate = normalizeToUTCDay(new Date());
  const startDate = calculateStartDate(period, evaluationDate);

  const sortFieldMap: Record<string, string> = {
    nom: "nom",
    total_jeunes: "total_jeunes",
    a_traiter: "a_traiter",
    traites: "traites",
    pourcentage_traites: "pourcentage_traites",
    derniere_activite: "derniere_activite",
    // Utilise le champ _sort qui a une grande valeur pour les null (ML sans activité en dernier)
    jours_depuis_activite: "jours_depuis_activite_sort",
  };

  const mongoSortField = sortFieldMap[sort_by] || "total_jeunes";
  const sortDirection = sort_order === "desc" ? -1 : 1;
  const skip = (page - 1) * limit;

  const pipeline = [
    {
      $match: {
        computed_day: { $lte: evaluationDate },
      },
    },
    { $sort: { computed_day: -1 as const } },
    {
      $group: {
        _id: "$mission_locale_id",
        latest_stats: { $first: "$stats" },
        latest_day: { $first: "$computed_day" },
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
        ],
        as: "period_start_entry",
      },
    },
    {
      $addFields: {
        first_stats: {
          $ifNull: [{ $arrayElemAt: ["$period_start_entry.stats", 0] }, "$latest_stats"],
        },
        first_day: {
          $ifNull: [{ $arrayElemAt: ["$period_start_entry.computed_day", 0] }, "$latest_day"],
        },
      },
    },
    { $unset: "period_start_entry" },
    {
      $lookup: {
        from: "organisations",
        localField: "_id",
        foreignField: "_id",
        as: "ml",
      },
    },
    { $unwind: "$ml" },
    {
      $match: {
        "ml.type": "MISSION_LOCALE",
        "ml.activated_at": { $exists: true, $ne: null },
        ...(region && { "ml.adresse.region": region }),
        ...(search && { "ml.nom": { $regex: escapeRegex(search), $options: "i" } }),
      },
    },
    {
      $lookup: {
        from: "regions",
        localField: "ml.adresse.region",
        foreignField: "code",
        as: "region_info",
      },
    },
    {
      $addFields: {
        total_jeunes: { $add: ["$latest_stats.a_traiter", "$latest_stats.traite"] },
        pourcentage_traites: {
          $round: [
            {
              $cond: [
                { $eq: [{ $add: ["$latest_stats.a_traiter", "$latest_stats.traite"] }, 0] },
                0,
                {
                  $multiply: [
                    {
                      $divide: ["$latest_stats.traite", { $add: ["$latest_stats.a_traiter", "$latest_stats.traite"] }],
                    },
                    100,
                  ],
                },
              ],
            },
            0,
          ],
        },
        first_pourcentage_traites: {
          $cond: [
            { $eq: [{ $add: ["$first_stats.a_traiter", "$first_stats.traite"] }, 0] },
            0,
            {
              $multiply: [
                { $divide: ["$first_stats.traite", { $add: ["$first_stats.a_traiter", "$first_stats.traite"] }] },
                100,
              ],
            },
          ],
        },
        nom: "$ml.nom",
        region_code: "$ml.adresse.region",
        region_nom: { $ifNull: [{ $arrayElemAt: ["$region_info.nom", 0] }, "Région inconnue"] },
        a_traiter: "$latest_stats.a_traiter",
        traites: "$latest_stats.traite",
      },
    },
    {
      $lookup: {
        from: "missionLocaleEffectif",
        localField: "_id",
        foreignField: "mission_locale_id",
        as: "effectif_ids",
      },
    },
    {
      $lookup: {
        from: "missionLocaleEffectifLog",
        let: { effectif_ids: "$effectif_ids._id" },
        pipeline: [
          { $match: { $expr: { $in: ["$mission_locale_effectif_id", "$$effectif_ids"] } } },
          { $sort: { created_at: -1 as const } },
          { $limit: 1 },
          { $project: { created_at: 1 } },
        ],
        as: "last_log",
      },
    },
    {
      $addFields: {
        derniere_activite: { $arrayElemAt: ["$last_log.created_at", 0] },
        jours_depuis_activite_sort: {
          $cond: [
            { $eq: [{ $arrayElemAt: ["$last_log.created_at", 0] }, null] },
            -9999999,
            {
              $multiply: [
                -1,
                {
                  $floor: {
                    $divide: [
                      { $subtract: [evaluationDate, { $arrayElemAt: ["$last_log.created_at", 0] }] },
                      1000 * 60 * 60 * 24,
                    ],
                  },
                },
              ],
            },
          ],
        },
        jours_depuis_activite: {
          $cond: [
            { $eq: [{ $arrayElemAt: ["$last_log.created_at", 0] }, null] },
            null,
            {
              $floor: {
                $divide: [
                  { $subtract: [evaluationDate, { $arrayElemAt: ["$last_log.created_at", 0] }] },
                  1000 * 60 * 60 * 24,
                ],
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
              details: {
                rdv_pris: { $ifNull: ["$latest_stats.rdv_pris", 0] },
                nouveau_projet: { $ifNull: ["$latest_stats.nouveau_projet", 0] },
                deja_accompagne: { $ifNull: ["$latest_stats.deja_accompagne", 0] },
                contacte_sans_retour: { $ifNull: ["$latest_stats.contacte_sans_retour", 0] },
                injoignables: { $ifNull: ["$latest_stats.injoignables", 0] },
                coordonnees_incorrectes: { $ifNull: ["$latest_stats.coordonnees_incorrectes", 0] },
                autre: { $ifNull: ["$latest_stats.autre", 0] },
              },
              derniere_activite: 1,
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

  const [result] = await missionLocaleStatsDb().aggregate(pipeline, { allowDiskUse: true }).toArray();

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
    };
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
  };
};

export const getSuiviTraitementByRegion = async () => {
  const evaluationDate = normalizeToUTCDay(new Date());

  const pipeline = [
    {
      $match: {
        computed_day: { $lte: evaluationDate },
      },
    },
    { $sort: { computed_day: -1 as const } },
    {
      $group: {
        _id: "$mission_locale_id",
        latest_stats: { $first: "$stats" },
      },
    },
    ...buildOrgLookupPipeline({ checkActivation: false, localField: "_id" }),
    {
      $group: {
        _id: "$ml.adresse.region",
        a_traiter: { $sum: "$latest_stats.a_traiter" },
        traites: { $sum: "$latest_stats.traite" },
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

export const getSyntheseStats = async (period: StatsPeriod = "30days") => {
  const evaluationDate = normalizeToUTCDay(new Date());

  const [summary, regional, traitement] = await Promise.all([
    getSummaryStats(evaluationDate, period),
    getRegionalStats(period),
    getTraitementStats(period, evaluationDate),
  ]);

  return {
    summary: {
      mlCount: summary.mlCount,
      activatedMlCount: summary.activatedMlCount,
      previousActivatedMlCount: summary.previousActivatedMlCount,
      date: summary.date,
    },
    regions: regional.regions,
    traitement: {
      latest: traitement.latest,
      first: traitement.first,
    },
    evaluationDate,
    period,
  };
};

const buildCountIf = (field: string, value: string) => ({
  $sum: { $cond: [{ $eq: [field, value] }, 1, 0] },
});

const DEFAULT_MOTIFS = {
  mobilite: 0,
  logement: 0,
  sante: 0,
  finance: 0,
  administratif: 0,
  reorientation: 0,
  recherche_emploi: 0,
  autre: 0,
};

const DEFAULT_STATUTS_TRAITEMENT = {
  rdv_pris: 0,
  nouveau_projet: 0,
  deja_accompagne: 0,
  contacte_sans_retour: 0,
  injoignables: 0,
  coordonnees_incorrectes: 0,
  autre: 0,
  total_traites: 0,
};

const MOTIFS_PIPELINE = [
  { $unwind: { path: "$organisme_data.motif", preserveNullAndEmptyArrays: true } },
  {
    $group: {
      _id: null,
      mobilite: buildCountIf("$organisme_data.motif", "MOBILITE"),
      logement: buildCountIf("$organisme_data.motif", "LOGEMENT"),
      sante: buildCountIf("$organisme_data.motif", "SANTE"),
      finance: buildCountIf("$organisme_data.motif", "FINANCE"),
      administratif: buildCountIf("$organisme_data.motif", "ADMINISTRATIF"),
      reorientation: buildCountIf("$organisme_data.motif", "REORIENTATION"),
      recherche_emploi: buildCountIf("$organisme_data.motif", "RECHERCHE_EMPLOI"),
      autre: buildCountIf("$organisme_data.motif", "AUTRE"),
    },
  },
];

const STATUTS_TRAITEMENT_PIPELINE = [
  {
    $group: {
      _id: null,
      rdv_pris: buildCountIf("$situation", "RDV_PRIS"),
      nouveau_projet: buildCountIf("$situation", "NOUVEAU_PROJET"),
      deja_accompagne: buildCountIf("$situation", "DEJA_ACCOMPAGNE"),
      contacte_sans_retour: buildCountIf("$situation", "CONTACTE_SANS_RETOUR"),
      injoignables: buildCountIf("$situation", "INJOIGNABLE_APRES_RELANCES"),
      coordonnees_incorrectes: buildCountIf("$situation", "COORDONNEES_INCORRECT"),
      autre: buildCountIf("$situation", "AUTRE"),
      total_traites: {
        $sum: { $cond: [{ $and: [{ $ne: ["$situation", null] }, { $ne: ["$situation", ""] }] }, 1, 0] },
      },
    },
  },
];

const getCfaPilotes = async () => {
  const cfaPilotes = (await organisationsDb()
    .find({
      type: "ORGANISME_FORMATION",
      ml_beta_activated_at: { $exists: true, $ne: null },
    })
    .toArray()) as IOrganisationOrganismeFormation[];

  const cfaPilotesOids = cfaPilotes
    .map((o) => (o.organisme_id ? new ObjectId(o.organisme_id) : null))
    .filter((id): id is ObjectId => id !== null);

  return { cfaPilotes, cfaPilotesOids };
};

const getRegionsActives = async (cfaPilotesOids: ObjectId[]) => {
  const organismesAvecRegion = await organismesDb()
    .find({ _id: { $in: cfaPilotesOids } }, { projection: { "adresse.region": 1 } })
    .toArray();

  return [...new Set(organismesAvecRegion.map((o) => o.adresse?.region).filter(Boolean))] as string[];
};

export const getAccompagnementConjointStats = async (region?: string): Promise<IAccompagnementConjointStats> => {
  const evaluationDate = normalizeToUTCDay(new Date());

  const { cfaPilotes, cfaPilotesOids } = await getCfaPilotes();
  const regionsActives = await getRegionsActives(cfaPilotesOids);

  const missionLocaleIds = region ? await getMissionLocaleIdsByRegion(region) : undefined;

  const [accConjointStats] = await missionLocaleEffectifsDb()
    .aggregate([
      {
        $match: {
          "effectif_snapshot.organisme_id": { $in: cfaPilotesOids },
          "organisme_data.acc_conjoint": true,
          ...(missionLocaleIds && { mission_locale_id: { $in: missionLocaleIds } }),
        },
      },
      {
        $facet: {
          dossiersPartages: [{ $count: "count" }],
          mlConcernees: [{ $group: { _id: "$mission_locale_id" } }, { $count: "count" }],
          motifs: MOTIFS_PIPELINE,
          statutsTraitement: STATUTS_TRAITEMENT_PIPELINE,
          dejaConnu: [
            {
              $group: {
                _id: null,
                count: { $sum: { $cond: [{ $eq: ["$deja_connu", true] }, 1, 0] } },
                total: { $sum: 1 },
              },
            },
          ],
        },
      },
    ])
    .toArray();

  const totalJeunesRupturants = await missionLocaleEffectifsDb().countDocuments({
    "effectif_snapshot.organisme_id": { $in: cfaPilotesOids },
    ...(missionLocaleIds && { mission_locale_id: { $in: missionLocaleIds } }),
  });

  const totalDossiersPartages = accConjointStats?.dossiersPartages[0]?.count || 0;
  const mlConcernees = accConjointStats?.mlConcernees[0]?.count || 0;
  const motifs = { ...DEFAULT_MOTIFS, ...accConjointStats?.motifs[0] };
  const statutsTraitement = { ...DEFAULT_STATUTS_TRAITEMENT, ...accConjointStats?.statutsTraitement[0] };
  const dejaConnuData = accConjointStats?.dejaConnu[0] || { count: 0, total: 0 };

  const totalDossiersTraites = statutsTraitement.total_traites;
  const pourcentageTraites =
    totalDossiersPartages > 0 ? Math.round((totalDossiersTraites / totalDossiersPartages) * 100) : 0;

  return {
    cfaPartenaires: cfaPilotes.length,
    mlConcernees,
    regionsActives,
    totalJeunesRupturants,
    totalDossiersPartages,
    totalDossiersTraites,
    pourcentageTraites,
    motifs: {
      mobilite: motifs.mobilite || 0,
      logement: motifs.logement || 0,
      sante: motifs.sante || 0,
      finance: motifs.finance || 0,
      administratif: motifs.administratif || 0,
      reorientation: motifs.reorientation || 0,
      recherche_emploi: motifs.recherche_emploi || 0,
      autre: motifs.autre || 0,
    },
    statutsTraitement: {
      rdv_pris: statutsTraitement.rdv_pris || 0,
      nouveau_projet: statutsTraitement.nouveau_projet || 0,
      deja_accompagne: statutsTraitement.deja_accompagne || 0,
      contacte_sans_retour: statutsTraitement.contacte_sans_retour || 0,
      injoignables: statutsTraitement.injoignables || 0,
      coordonnees_incorrectes: statutsTraitement.coordonnees_incorrectes || 0,
      autre: statutsTraitement.autre || 0,
    },
    dejaConnu: dejaConnuData.count,
    totalPourDejaConnu: dejaConnuData.total,
    evaluationDate,
  };
};

async function countEngagedMlAtDate(date: Date): Promise<number> {
  const [result] = await missionLocaleStatsDb()
    .aggregate(
      [
        { $match: { computed_day: date } },
        ...buildOrgLookupPipeline({ checkActivation: true }),
        {
          $match: {
            "stats.total": { $ne: 0 },
            $expr: { $gte: [{ $divide: ["$stats.traite", "$stats.total"] }, ENGAGEMENT_THRESHOLD] },
          },
        },
        { $count: "count" },
      ],
      { allowDiskUse: true }
    )
    .toArray();

  return result?.count || 0;
}

async function getNationalEngagementStats(evaluationDate: Date, startDate: Date) {
  const [engagedMlCount, previousEngagedMlCount] = await Promise.all([
    countEngagedMlAtDate(evaluationDate),
    countEngagedMlAtDate(startDate),
  ]);

  return { engagedMlCount, previousEngagedMlCount };
}

export async function getDeploymentStats(period: StatsPeriod = "30days") {
  const evaluationDate = normalizeToUTCDay(new Date());
  const startDate = await calculateStartDateAsync(period, evaluationDate);

  const [summary, regional, engagement] = await Promise.all([
    getSummaryStats(evaluationDate, period),
    getRegionalStats(period),
    getNationalEngagementStats(evaluationDate, startDate),
  ]);

  return {
    summary: {
      mlCount: summary.mlCount,
      activatedMlCount: summary.activatedMlCount,
      previousActivatedMlCount: summary.previousActivatedMlCount,
      engagedMlCount: engagement.engagedMlCount,
      previousEngagedMlCount: engagement.previousEngagedMlCount,
      date: summary.date,
    },
    regionsActives: regional.regions.filter((r) => r.deployed).map((r) => r.code),
    evaluationDate,
    period,
  };
}

export async function getSyntheseRegionsStats(period: StatsPeriod = "30days") {
  const regional = await getRegionalStats(period);

  return {
    regions: regional.regions,
    period,
  };
}

export async function getRupturantsStats(period: StatsPeriod = "30days", region?: string, mlId?: string) {
  const evaluationDate = normalizeToUTCDay(new Date());
  const endDate = evaluationDate;
  const startDate = await calculateStartDateAsync(period, endDate);

  const missionLocaleIds = mlId ? [new ObjectId(mlId)] : region ? await getMissionLocaleIdsByRegion(region) : undefined;

  const evenlySpacedDates = await getEvenlySpacedDates(period, endDate);
  const rupturantsTimeSeries: ITimeSeriesPoint[] = await getCumulativeStatsForDates(
    evenlySpacedDates,
    missionLocaleIds
  );

  const [currentStats, previousStats] = await Promise.all([
    getStatsForPeriod(endDate, missionLocaleIds),
    getStatsForPeriod(startDate, missionLocaleIds),
  ]);

  const rupturantsSummary: IRupturantsSummary = {
    a_traiter: createStatWithVariation(currentStats.total_a_traiter, previousStats.total_a_traiter),
    traites: createStatWithVariation(currentStats.total_traites, previousStats.total_traites),
    total: currentStats.total,
  };

  return {
    timeSeries: rupturantsTimeSeries,
    summary: rupturantsSummary,
    evaluationDate,
    period,
  };
}

export async function getDossiersTraitesStats(period: StatsPeriod = "30days", region?: string, mlId?: string) {
  const evaluationDate = normalizeToUTCDay(new Date());
  const endDate = evaluationDate;
  const startDate = await calculateStartDateAsync(period, endDate);

  const missionLocaleIds = mlId ? [new ObjectId(mlId)] : region ? await getMissionLocaleIdsByRegion(region) : undefined;

  const [currentStats, previousStats] = await Promise.all([
    getStatsForPeriod(endDate, missionLocaleIds),
    getStatsForPeriod(startDate, missionLocaleIds),
  ]);

  const detailsTraites: IDetailsDossiersTraites = {
    rdv_pris: createStatWithVariation(currentStats.rdv_pris, previousStats.rdv_pris),
    nouveau_projet: createStatWithVariation(currentStats.nouveau_projet, previousStats.nouveau_projet),
    contacte_sans_retour: createStatWithVariation(
      currentStats.contacte_sans_retour,
      previousStats.contacte_sans_retour
    ),
    deja_accompagne: createStatWithVariation(currentStats.deja_accompagne, previousStats.deja_accompagne),
    injoignables: createStatWithVariation(currentStats.injoignables, previousStats.injoignables),
    coordonnees_incorrectes: createStatWithVariation(
      currentStats.coordonnees_incorrectes,
      previousStats.coordonnees_incorrectes
    ),
    autre: createStatWithVariation(currentStats.autre, previousStats.autre),
    deja_connu: currentStats.deja_connu,
    total: currentStats.total_traites,
  };

  return {
    details: detailsTraites,
    evaluationDate,
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
