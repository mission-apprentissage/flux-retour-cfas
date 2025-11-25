import { ObjectId } from "bson";
import { IOrganisationMissionLocale } from "shared/models";
import {
  IAggregatedStats,
  IDetailsDossiersTraites,
  INationalStats,
  IRupturantsSummary,
  IStatWithVariation,
  ITimeSeriesPoint,
  ITraitementStatsResponse,
  StatsPeriod,
} from "shared/models/data/nationalStats.model";
import { normalizeToUTCDay } from "shared/utils/date";
import { calculateVariation, calculatePercentage } from "shared/utils/stats";

import logger from "@/common/logger";
import { missionLocaleStatsDb, organisationsDb } from "@/common/model/collections";

import { getOrganisationById } from "../organisations.actions";

import { computeMissionLocaleStats } from "./mission-locale.actions";

export type { StatsPeriod } from "shared/models/data/nationalStats.model";

const TIME_SERIES_POINTS_COUNT = 6;

const EMPTY_STATS = {
  total: 0,
  total_a_traiter: 0,
  total_traites: 0,
  rdv_pris: 0,
  nouveau_projet: 0,
  deja_accompagne: 0,
  contacte_sans_retour: 0,
  injoignables: 0,
  coordonnees_incorrectes: 0,
  autre: 0,
  deja_connu: 0,
  total_contacte: 0,
  total_repondu: 0,
  total_accompagne: 0,
};

const buildOrgLookupPipeline = (options: { checkActivation?: boolean; localField?: string } = {}) => {
  const { checkActivation = true, localField = "mission_locale_id" } = options;
  const matchConditions: Record<string, unknown> = {
    "ml.type": "MISSION_LOCALE",
  };
  if (checkActivation) {
    matchConditions["ml.activated_at"] = { $exists: true, $ne: null };
  }

  return [
    {
      $lookup: {
        from: "organisations",
        localField,
        foreignField: "_id",
        as: "ml",
      },
    },
    { $unwind: "$ml" },
    { $match: matchConditions },
  ];
};

const buildRegionLookupPipeline = (localField = "_id") => [
  {
    $lookup: {
      from: "regions",
      localField,
      foreignField: "code",
      as: "region_info",
    },
  },
  {
    $addFields: {
      nom: { $ifNull: [{ $arrayElemAt: ["$region_info.nom", 0] }, "Région inconnue"] },
    },
  },
];

type MongoExpression = string | Record<string, unknown>;
const buildPercentageExpression = (numerator: MongoExpression, denominator: MongoExpression) => ({
  $cond: [
    { $eq: [denominator, 0] },
    0,
    {
      $round: [{ $multiply: [{ $divide: [numerator, denominator] }, 100] }, 0],
    },
  ],
});

const getEarliestDate = async () => {
  const earliestDate = await missionLocaleStatsDb().findOne(
    {},
    { sort: { computed_day: 1 }, projection: { computed_day: 1 } }
  );
  return earliestDate?.computed_day;
};

function calculateStartDate(period: StatsPeriod, referenceDate: Date, earliestDate?: Date): Date {
  const startDate = new Date(referenceDate);

  switch (period) {
    case "30days":
      startDate.setUTCDate(referenceDate.getUTCDate() - 30);
      break;
    case "3months":
      startDate.setUTCMonth(referenceDate.getUTCMonth() - 3);
      break;
    case "all":
      return normalizeToUTCDay(earliestDate || new Date(0));
  }

  return normalizeToUTCDay(startDate);
}

async function calculateStartDateAsync(period: StatsPeriod, referenceDate: Date): Promise<Date> {
  if (period === "all") {
    const earliestDate = await getEarliestDate();
    return calculateStartDate(period, referenceDate, earliestDate || undefined);
  }
  return calculateStartDate(period, referenceDate);
}

function createStatWithVariation(current: number, previous: number): IStatWithVariation {
  return {
    current,
    variation: calculatePercentage(current, previous),
  };
}

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

const getSummaryStats = async (evaluationDate: Date, period: StatsPeriod = "all") => {
  const normalizedDate = normalizeToUTCDay(evaluationDate);

  const startDate = await calculateStartDateAsync(period, normalizedDate);

  const [mlCount, activatedMlCount, previousActivatedMlCount] = await Promise.all([
    organisationsDb().countDocuments({ type: "MISSION_LOCALE" }),
    organisationsDb().countDocuments({
      type: "MISSION_LOCALE",
      activated_at: { $lte: normalizedDate },
    }),
    organisationsDb().countDocuments({
      type: "MISSION_LOCALE",
      activated_at: { $lte: startDate },
    }),
  ]);

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

type MongoAggregationField = string | { $ifNull: [string, number] };

const getStatsAtDate = async (currentDate: Date, options: StatsAggregationOptions = DEFAULT_STATS_OPTIONS) => {
  const opts = { ...DEFAULT_STATS_OPTIONS, ...options };

  const totalContacteAdd: MongoAggregationField[] = [
    "$stats.rdv_pris",
    "$stats.nouveau_projet",
    "$stats.deja_accompagne",
    "$stats.contacte_sans_retour",
  ];
  if (opts.includeInjoignableInContacte) {
    totalContacteAdd.push({ $ifNull: ["$stats.injoignables", 0] });
  }

  const totalReponduAdd: MongoAggregationField[] = [
    "$stats.rdv_pris",
    "$stats.nouveau_projet",
    "$stats.deja_accompagne",
  ];
  if (opts.includeAutreAvecContactInRepondu) {
    totalReponduAdd.push({ $ifNull: ["$stats.autre_avec_contact", 0] });
  }

  const totalAccompagneAdd: MongoAggregationField[] = opts.accompagneUsesNouveauProjet
    ? ["$stats.rdv_pris", "$stats.nouveau_projet"]
    : ["$stats.rdv_pris", "$stats.deja_accompagne"];

  const stats = await missionLocaleStatsDb()
    .aggregate([
      { $match: { computed_day: currentDate } },
      {
        $group: {
          _id: null,
          total: { $sum: "$stats.total" },
          total_traites: { $sum: "$stats.traite" },
          total_a_traiter: { $sum: "$stats.a_traiter" },
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
          rdv_pris: { $sum: "$stats.rdv_pris" },
          nouveau_projet: { $sum: "$stats.nouveau_projet" },
          deja_accompagne: { $sum: "$stats.deja_accompagne" },
          contacte_sans_retour: { $sum: "$stats.contacte_sans_retour" },
          injoignables: { $sum: { $ifNull: ["$stats.injoignables", 0] } },
          coordonnees_incorrectes: { $sum: "$stats.coordonnees_incorrectes" },
          autre: { $sum: "$stats.autre" },
          autre_avec_contact: { $sum: { $ifNull: ["$stats.autre_avec_contact", 0] } },
          deja_connu: { $sum: "$stats.deja_connu" },
        },
      },
    ])
    .toArray();

  return stats;
};

const getStatsAtDateWithInjoignable = async (currentDate: Date) => {
  return getStatsAtDate(currentDate, {
    includeInjoignableInContacte: false,
    includeAutreAvecContactInRepondu: false,
    accompagneUsesNouveauProjet: true,
  });
};

const getCumulativeStatsAtDate = async (currentDate: Date) => {
  const stats = await missionLocaleStatsDb()
    .aggregate([
      { $match: { computed_day: { $lte: currentDate } } },
      {
        $sort: { computed_day: -1 },
      },
      {
        $group: {
          _id: "$mission_locale_id",
          latest_stats: { $first: "$stats" },
          latest_day: { $first: "$computed_day" },
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
              $add: [
                "$latest_stats.rdv_pris",
                "$latest_stats.nouveau_projet",
                "$latest_stats.deja_accompagne",
                "$latest_stats.contacte_sans_retour",
              ],
            },
          },
          total_repondu: {
            $sum: {
              $add: ["$latest_stats.rdv_pris", "$latest_stats.nouveau_projet", "$latest_stats.deja_accompagne"],
            },
          },
          total_accompagne: { $sum: { $add: ["$latest_stats.rdv_pris", "$latest_stats.nouveau_projet"] } },
          rdv_pris: { $sum: "$latest_stats.rdv_pris" },
          nouveau_projet: { $sum: "$latest_stats.nouveau_projet" },
          deja_accompagne: { $sum: "$latest_stats.deja_accompagne" },
          contacte_sans_retour: { $sum: "$latest_stats.contacte_sans_retour" },
          injoignables: { $sum: "$latest_stats.injoignables" },
          coordonnees_incorrectes: { $sum: "$latest_stats.coordonnees_incorrectes" },
          autre: { $sum: "$latest_stats.autre" },
          deja_connu: { $sum: "$latest_stats.deja_connu" },
        },
      },
    ])
    .toArray();

  return stats;
};

const getEvenlySpacedDates = async (period: StatsPeriod, referenceDate: Date): Promise<Date[]> => {
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
          ml_ids: { $push: "$_id" },
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
    .aggregate([
      { $match: { computed_day: { $in: [evaluationDate, startDate] } } },
      ...buildOrgLookupPipeline({ checkActivation: true }),
      {
        $project: {
          region_code: "$ml.adresse.region",
          computed_day: 1,
          is_engaged: {
            $cond: [
              {
                $and: [{ $ne: ["$stats.total", 0] }, { $gte: [{ $divide: ["$stats.traite", "$stats.total"] }, 0.7] }],
              },
              1,
              0,
            ],
          },
        },
      },
      {
        $group: {
          _id: { region: "$region_code", date: "$computed_day" },
          engaged_count: { $sum: "$is_engaged" },
        },
      },
    ])
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
    .aggregate([
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
    ])
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

const getRegionalStats = async (period: StatsPeriod = "30days") => {
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

async function getStatsForPeriod(
  startDate: Date,
  endDate: Date
): Promise<IAggregatedStats & { total_contacte: number; total_repondu: number; total_accompagne: number }> {
  try {
    let stats = await getStatsAtDateWithInjoignable(endDate);

    if (stats.length === 0) {
      const lastAvailableStats = await missionLocaleStatsDb()
        .find({
          computed_day: { $lte: endDate, $gte: startDate },
        })
        .sort({ computed_day: -1 })
        .limit(1)
        .toArray();

      if (lastAvailableStats.length > 0) {
        const lastDate = lastAvailableStats[0].computed_day;
        stats = await getStatsAtDateWithInjoignable(lastDate);
      }
    }

    if (stats.length === 0) {
      logger.warn(
        `[getStatsForPeriod] Aucune donnée disponible pour la période ${startDate.toISOString()} - ${endDate.toISOString()}`
      );
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
      `[getStatsForPeriod] Erreur lors de la récupération des stats pour la période ${startDate.toISOString()} - ${endDate.toISOString()}`,
      error
    );
    return { ...EMPTY_STATS };
  }
}

const getTraitementStats = async (
  period: StatsPeriod = "30days",
  evaluationDate: Date = normalizeToUTCDay(new Date())
): Promise<ITraitementStatsResponse> => {
  const endDate = evaluationDate;
  const evenlySpacedDates = await getEvenlySpacedDates(period, endDate);

  const allStatsResults = await Promise.allSettled(
    evenlySpacedDates.map(async (date) => {
      const stats = await getStatsAtDate(date);
      return {
        date,
        stats: stats,
      };
    })
  );

  const allStats = allStatsResults
    .filter((result) => result.status === "fulfilled")
    .map((result) => (result as PromiseFulfilledResult<{ date: Date; stats: any[] }>).value);

  const latestEntry = allStats
    .slice()
    .reverse()
    .find((entry) => entry.stats.length > 0);

  const firstEntry = allStats[0];

  const latestStats = latestEntry?.stats[0] || {
    total: 0,
    total_contacte: 0,
    total_repondu: 0,
    total_accompagne: 0,
  };

  const firstStats = firstEntry?.stats[0] || {
    total: 0,
    total_contacte: 0,
    total_repondu: 0,
    total_accompagne: 0,
  };

  return {
    latest: {
      total: latestStats.total,
      total_contacte: latestStats.total_contacte,
      total_repondu: latestStats.total_repondu,
      total_accompagne: latestStats.total_accompagne,
    },
    first: {
      total: firstStats.total,
      total_contacte: firstStats.total_contacte,
      total_repondu: firstStats.total_repondu,
      total_accompagne: firstStats.total_accompagne,
    },
    evaluationDate: endDate,
    period,
  };
};

export const getNationalStats = async (period: StatsPeriod = "30days"): Promise<INationalStats> => {
  const evaluationDate = normalizeToUTCDay(new Date());

  const endDate = evaluationDate;
  const startDate = await calculateStartDateAsync(period, endDate);
  const previousStartDate = await calculateStartDateAsync(period, startDate);

  const evenlySpacedDates = await getEvenlySpacedDates(period, endDate);

  const timeSeriesResults = await Promise.allSettled(
    evenlySpacedDates.map(async (date) => {
      const stats = await getCumulativeStatsAtDate(date);
      return {
        date,
        stats: stats.map((s) => ({
          total: s.total || 0,
          total_a_traiter: s.total_a_traiter || 0,
          total_traites: s.total_traites || 0,
        })),
      };
    })
  );

  const rupturantsTimeSeries: ITimeSeriesPoint[] = timeSeriesResults
    .filter((result) => result.status === "fulfilled")
    .map((result) => (result as PromiseFulfilledResult<ITimeSeriesPoint>).value);

  const [currentStats, previousStats, regionalData, traitementData] = await Promise.all([
    getStatsForPeriod(startDate, endDate),
    getStatsForPeriod(previousStartDate, startDate),
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
  page: number;
  limit: number;
  sort_by: string;
  sort_order: "asc" | "desc";
}

export const getTraitementStatsByMissionLocale = async (params: TraitementMLParams) => {
  const { period, page, limit, sort_by, sort_order } = params;
  const evaluationDate = normalizeToUTCDay(new Date());
  const startDate = calculateStartDate(period, evaluationDate);

  const latestStatsPipeline = [
    {
      $match: {
        computed_day: { $lte: evaluationDate, $gte: startDate },
      },
    },
    { $sort: { computed_day: -1 as const } },
    {
      $group: {
        _id: "$mission_locale_id",
        latest_stats: { $first: "$stats" },
        latest_day: { $first: "$computed_day" },
        first_stats: { $last: "$stats" },
        first_day: { $last: "$computed_day" },
      },
    },
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
      $lookup: {
        from: "missionLocaleEffectif",
        localField: "_id",
        foreignField: "mission_locale_id",
        as: "effectifs",
      },
    },
    {
      $lookup: {
        from: "missionLocaleEffectifLog",
        let: { effectif_ids: "$effectifs._id" },
        pipeline: [
          { $match: { $expr: { $in: ["$mission_locale_effectif_id", "$$effectif_ids"] } } },
          { $sort: { created_at: -1 as const } },
          { $limit: 1 },
        ],
        as: "last_log",
      },
    },
    {
      $addFields: {
        total_jeunes: { $add: ["$latest_stats.a_traiter", "$latest_stats.traite"] },
        pourcentage_traites: {
          $cond: [
            { $eq: [{ $add: ["$latest_stats.a_traiter", "$latest_stats.traite"] }, 0] },
            0,
            {
              $multiply: [
                { $divide: ["$latest_stats.traite", { $add: ["$latest_stats.a_traiter", "$latest_stats.traite"] }] },
                100,
              ],
            },
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
        derniere_activite: { $arrayElemAt: ["$last_log.created_at", 0] },
      },
    },
    {
      $addFields: {
        pourcentage_evolution_value: {
          $round: [{ $subtract: ["$pourcentage_traites", "$first_pourcentage_traites"] }, 0],
        },
      },
    },
    {
      $project: {
        id: { $toString: "$_id" },
        nom: "$ml.nom",
        region_code: "$ml.adresse.region",
        region_nom: { $ifNull: [{ $arrayElemAt: ["$region_info.nom", 0] }, "Région inconnue"] },
        total_jeunes: 1,
        a_traiter: "$latest_stats.a_traiter",
        traites: "$latest_stats.traite",
        pourcentage_traites: { $round: ["$pourcentage_traites", 0] },
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
        pourcentage_evolution_value: 1,
      },
    },
  ];

  const countPipeline = [...latestStatsPipeline.slice(0, 9), { $count: "total" }];

  const [countResult, allResults] = await Promise.all([
    missionLocaleStatsDb().aggregate(countPipeline).toArray(),
    missionLocaleStatsDb().aggregate(latestStatsPipeline).toArray(),
  ]);

  const total = countResult[0]?.total || 0;

  const sortMultiplier = sort_order === "desc" ? -1 : 1;
  const sortedResults = [...allResults].sort((a, b) => {
    const aVal = a[sort_by] ?? 0;
    const bVal = b[sort_by] ?? 0;

    if (sort_by === "nom") {
      return sortMultiplier * String(aVal).localeCompare(String(bVal), "fr");
    }
    return sortMultiplier * (Number(aVal) - Number(bVal));
  });

  const skip = (page - 1) * limit;
  const paginatedResults = sortedResults.slice(skip, skip + limit);

  const resultsWithEvolution = paginatedResults.map((item) => {
    const evolutionValue = item.pourcentage_evolution_value || 0;
    let pourcentage_evolution = "=";
    if (evolutionValue > 0) {
      pourcentage_evolution = `+${evolutionValue}%`;
    } else if (evolutionValue < 0) {
      pourcentage_evolution = `${evolutionValue}%`;
    }

    const { pourcentage_evolution_value, ...rest } = item;
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

export const getSuiviTraitementByRegion = async (period: StatsPeriod = "30days") => {
  const evaluationDate = normalizeToUTCDay(new Date());
  const startDate = calculateStartDate(period, evaluationDate);

  const pipeline = [
    {
      $match: {
        computed_day: { $lte: evaluationDate, $gte: startDate },
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
    { $match: { _id: { $ne: null } } },
    { $sort: { pourcentage_traites: -1 as const } },
  ];

  const results = await missionLocaleStatsDb().aggregate(pipeline).toArray();

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
