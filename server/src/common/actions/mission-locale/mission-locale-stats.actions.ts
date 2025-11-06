import { ObjectId } from "bson";
import { IOrganisationMissionLocale } from "shared/models";

import { missionLocaleStatsDb, organisationsDb } from "@/common/model/collections";

import { getOrganisationById } from "../organisations.actions";

import { computeMissionLocaleStats } from "./mission-locale.actions";

export const createOrUpdateMissionLocaleStats = async (missionLocaleId: ObjectId, date?: Date) => {
  const dateToUse = date ?? new Date();
  dateToUse.setUTCHours(0, 0, 0, 0);

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
  const normalizedDate = new Date(evaluationDate);
  normalizedDate.setUTCHours(0, 0, 0, 0);

  const mlCount = await organisationsDb().countDocuments({ type: "MISSION_LOCALE" });
  const activatedMlCount = await organisationsDb().countDocuments({
    type: "MISSION_LOCALE",
    activated_at: { $lte: normalizedDate },
  });

  const evenlySpacedDates = await getEvenlySpacedDates(period, normalizedDate);

  const firstDate = evenlySpacedDates[0];
  const previousActivatedMlCount = await organisationsDb().countDocuments({
    type: "MISSION_LOCALE",
    activated_at: { $lte: firstDate },
  });

  const summary = await Promise.allSettled(
    evenlySpacedDates.map(async (date) => {
      const stats = await getStatsAtDate(date);
      return {
        date,
        stats: stats,
      };
    })
  );

  const arml = await Promise.allSettled(
    [evenlySpacedDates[0], evenlySpacedDates[evenlySpacedDates.length - 1]].map(async (date) => {
      const stats = await getARMLStatsAtDate(date);
      return {
        date,
        stats: stats,
      };
    })
  );

  return {
    summary: summary.filter((result) => result.status === "fulfilled").map((result) => result.value),
    arml: arml.filter((result) => result.status === "fulfilled").map((result) => result.value),
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
              ],
            },
          },
          total_repondu: { $sum: { $add: ["$stats.rdv_pris", "$stats.nouveau_projet", "$stats.deja_accompagne"] } },
          total_accompagne: { $sum: { $add: ["$stats.rdv_pris", "$stats.nouveau_projet"] } },
          rdv_pris: { $sum: "$stats.rdv_pris" },
          nouveau_projet: { $sum: "$stats.nouveau_projet" },
          deja_accompagne: { $sum: "$stats.deja_accompagne" },
          contacte_sans_retour: { $sum: "$stats.contacte_sans_retour" },
          coordonnees_incorrectes: { $sum: "$stats.coordonnees_incorrectes" },
          autre: { $sum: "$stats.autre" },
          deja_connu: { $sum: "$stats.deja_connu" },
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
  for (let i = 0; i < 6; i++) {
    const intervalTime = startDate.getTime() + (timeDiff * i) / 5;
    const date = new Date(intervalTime);
    date.setUTCHours(0, 0, 0, 0);
    dates.push(date);
  }

  return dates;
};

export const getRegionalStats = async (period: "30days" | "3months" | "all" = "30days") => {
  const evaluationDate = new Date();
  evaluationDate.setUTCHours(0, 0, 0, 0);

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
  startDate.setUTCHours(0, 0, 0, 0);

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

  const regionsWithEngagement = regions
    .filter((region) => region._id != null)
    .map((region) => {
      const engagement = engagementByRegionDate.get(region._id) || { current: 0, previous: 0 };

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
      };
    });

  return {
    regions: regionsWithEngagement,
  };
};
