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
      computed_day: date,
    },
    {
      $set: {
        stats: mlStats,
        updated_at: new Date(),
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
