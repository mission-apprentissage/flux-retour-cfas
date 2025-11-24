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
} from "shared/models/data/nationalStats.model";
import { normalizeToUTCDay } from "shared/utils/date";
import { calculateVariation } from "shared/utils/stats";

import logger from "@/common/logger";
import { missionLocaleStatsDb, organisationsDb } from "@/common/model/collections";

import { getOrganisationById } from "../organisations.actions";

import { computeMissionLocaleStats } from "./mission-locale.actions";

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

export const getSummaryStats = async (evaluationDate: Date, period: "30days" | "3months" | "all" = "all") => {
  const normalizedDate = normalizeToUTCDay(evaluationDate);

  const startDate = await calculateStartDate(period, normalizedDate);

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

export const getStatsAtDate = async (currentDate: Date) => {
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
              $add: [
                "$stats.rdv_pris",
                "$stats.nouveau_projet",
                "$stats.deja_accompagne",
                "$stats.contacte_sans_retour",
                { $ifNull: ["$stats.injoignables", 0] },
              ],
            },
          },
          total_repondu: {
            $sum: {
              $add: [
                "$stats.rdv_pris",
                "$stats.nouveau_projet",
                "$stats.deja_accompagne",
                { $ifNull: ["$stats.autre_avec_contact", 0] },
              ],
            },
          },
          total_accompagne: { $sum: { $add: ["$stats.rdv_pris", "$stats.deja_accompagne"] } },
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

export const getStatsAtDateWithInjoignable = async (currentDate: Date) => {
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
              $add: [
                "$stats.rdv_pris",
                "$stats.nouveau_projet",
                "$stats.deja_accompagne",
                "$stats.contacte_sans_retour",
              ],
            },
          },
          total_repondu: { $sum: { $add: ["$stats.rdv_pris", "$stats.nouveau_projet", "$stats.deja_accompagne"] } },
          total_accompagne: { $sum: { $add: ["$stats.rdv_pris", "$stats.nouveau_projet"] } },
          rdv_pris: { $sum: "$stats.rdv_pris" },
          nouveau_projet: { $sum: "$stats.nouveau_projet" },
          deja_accompagne: { $sum: "$stats.deja_accompagne" },
          contacte_sans_retour: { $sum: "$stats.contacte_sans_retour" },
          injoignables: { $sum: "$stats.injoignables" },
          coordonnees_incorrectes: { $sum: "$stats.coordonnees_incorrectes" },
          autre: { $sum: "$stats.autre" },
          deja_connu: { $sum: "$stats.deja_connu" },
        },
      },
    ])
    .toArray();

  return stats;
};

export const getCumulativeStatsAtDate = async (currentDate: Date) => {
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

export const getARMLStatsAtDate = async (currentDate: Date) => {
  return await organisationsDb()
    .aggregate([
      { $match: { type: "ARML" } },
      {
        $lookup: {
          from: "organisations",
          let: { arml_id: "$_id" },
          pipeline: [
            {
              $match: { $expr: { $and: [{ $eq: ["$type", "MISSION_LOCALE"] }, { $eq: ["$arml_id", "$$arml_id"] }] } },
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                activated_count: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $ne: [{ $ifNull: ["$activated_at", null] }, null] },
                          { $lte: ["$activated_at", currentDate] },
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
          as: "missions_locales",
        },
      },
    ])
    .toArray();
};

const TIME_SERIES_POINTS_COUNT = 6;

export const getEarliestDate = async () => {
  const earliestDate = await missionLocaleStatsDb().findOne(
    {},
    { sort: { computed_day: 1 }, projection: { computed_day: 1 } }
  );
  return earliestDate?.computed_day;
};

export const getEvenlySpacedDates = async (
  period: "30days" | "3months" | "all",
  referenceDate: Date
): Promise<Date[]> => {
  let startDate: Date;

  switch (period) {
    case "30days":
      startDate = new Date(referenceDate);
      startDate.setUTCDate(referenceDate.getUTCDate() - 30);
      break;
    case "3months":
      startDate = new Date(referenceDate);
      startDate.setUTCMonth(referenceDate.getUTCMonth() - 3);
      break;
    case "all":
      startDate = (await getEarliestDate()) || referenceDate;
      break;
    default:
      throw new Error(`Invalid period: ${period}`);
  }

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

export const getRegionalStats = async (period: "30days" | "3months" | "all" = "30days") => {
  const evaluationDate = normalizeToUTCDay(new Date());

  let startDate = new Date(evaluationDate);
  switch (period) {
    case "30days":
      startDate.setUTCDate(evaluationDate.getUTCDate() - 30);
      break;
    case "3months":
      startDate.setUTCMonth(evaluationDate.getUTCMonth() - 3);
      break;
    case "all":
      startDate = new Date(0);
      break;
  }
  startDate = normalizeToUTCDay(startDate);

  const { DEPLOYED_REGION_CODES } = await import("shared/constants/deployedRegions");

  const regions = await organisationsDb()
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

  const allEngagementStats = await missionLocaleStatsDb()
    .aggregate([
      {
        $match: {
          computed_day: { $in: [evaluationDate, startDate] },
        },
      },
      {
        $lookup: {
          from: "organisations",
          localField: "mission_locale_id",
          foreignField: "_id",
          as: "ml",
        },
      },
      { $unwind: "$ml" },
      {
        $match: {
          "ml.activated_at": { $exists: true, $ne: null },
          "ml.type": "MISSION_LOCALE",
        },
      },
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
          _id: {
            region: "$region_code",
            date: "$computed_day",
          },
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

  const getTraitementStatsByPeriod = async (
    endDate: Date,
    startDate?: Date
  ): Promise<Array<{ _id: string; a_traiter: number; traites: number }>> => {
    const matchCondition = startDate ? { $lte: endDate, $gte: startDate } : { $lte: endDate };

    return (await missionLocaleStatsDb()
      .aggregate([
        {
          $match: {
            computed_day: matchCondition,
          },
        },
        {
          $lookup: {
            from: "organisations",
            localField: "mission_locale_id",
            foreignField: "_id",
            as: "ml",
          },
        },
        { $unwind: "$ml" },
        {
          $match: {
            "ml.type": "MISSION_LOCALE",
          },
        },
        { $sort: { computed_day: -1 } },
        {
          $group: {
            _id: {
              mission_locale_id: "$mission_locale_id",
              region: "$ml.adresse.region",
            },
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
      .toArray()) as any as Array<{ _id: string; a_traiter: number; traites: number }>;
  };

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

async function calculateStartDate(period: "30days" | "3months" | "all", referenceDate: Date): Promise<Date> {
  const startDate = new Date(referenceDate);

  switch (period) {
    case "30days":
      startDate.setUTCDate(referenceDate.getUTCDate() - 30);
      break;
    case "3months":
      startDate.setUTCMonth(referenceDate.getUTCMonth() - 3);
      break;
    case "all": {
      const earliestDate = await getEarliestDate();
      return normalizeToUTCDay(earliestDate || new Date(0));
    }
  }

  return normalizeToUTCDay(startDate);
}

function createStatWithVariation(current: number, previous: number): IStatWithVariation {
  return {
    current,
    variation: calculateVariation(current, previous),
  };
}

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
      return {
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
    return {
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
  }
}

export const getTraitementStats = async (
  period: "30days" | "3months" | "all" = "30days",
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

export const getNationalStats = async (period: "30days" | "3months" | "all" = "30days"): Promise<INationalStats> => {
  const evaluationDate = normalizeToUTCDay(new Date());

  const endDate = evaluationDate;
  const startDate = await calculateStartDate(period, endDate);
  const previousStartDate = await calculateStartDate(period, startDate);

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

  const [currentStats, previousStats] = await Promise.all([
    getStatsForPeriod(startDate, endDate),
    getStatsForPeriod(previousStartDate, startDate),
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
    evaluationDate: endDate,
    period,
  };
};
