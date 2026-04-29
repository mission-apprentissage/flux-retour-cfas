import { ObjectId } from "bson";
import { DEPARTEMENTS_BY_CODE } from "shared/constants/territoires";
import { IOrganisationMissionLocale, IOrganisationOrganismeFormation } from "shared/models";
import {
  IAccompagnementConjointStats,
  IAggregatedStats,
  IClassifierStats,
  IDetailsDossiersTraites,
  IDetailsDossiersTraitesV2,
  IRupturantsSummary,
  ITimeSeriesPoint,
  ITraitementStatsResponse,
  StatsPeriod,
} from "shared/models/data/nationalStats.model";
import { normalizeToUTCDay } from "shared/utils/date";
import { calculatePercentage } from "shared/utils/stats";

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
  buildTotalTraitesV2Expression,
  calculateStartDate,
  calculateStartDateAsync,
  createStatWithVariation,
  EMPTY_STATS,
  ENGAGEMENT_THRESHOLD,
  getLatestStatsLowerBound,
  getMissionLocaleIdsByRegion,
  TIME_SERIES_POINTS_COUNT,
  withMissionLocaleFilter,
} from "./mission-locale-stats.helpers";
import { computeMissionLocaleStats } from "./mission-locale.actions";
import { CONTACT_OPPORTUN_SCORE_THRESHOLD } from "./mission-locale.constants";

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

const getLatestStatsPerML = async (endDate: Date, missionLocaleIds?: ObjectId[]) => {
  const matchFilter = withMissionLocaleFilter(
    { computed_day: { $lte: endDate, $gte: getLatestStatsLowerBound(endDate) } },
    missionLocaleIds
  );

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
        $group: {
          _id: null,
          total: { $sum: "$latest_stats.total" },
          total_traites: { $sum: buildTotalTraitesV2Expression() },
          total_a_traiter: { $sum: "$latest_stats.a_traiter" },
          rdv_pris: { $sum: "$latest_stats.rdv_pris" },
          rdv_pris_decouverts: { $sum: { $ifNull: ["$latest_stats.rdv_pris_decouverts", 0] } },
          nouveau_projet: { $sum: "$latest_stats.nouveau_projet" },
          contacte_sans_retour: { $sum: "$latest_stats.contacte_sans_retour" },
          injoignables: { $sum: { $ifNull: ["$latest_stats.injoignables", 0] } },
          coordonnees_incorrectes: { $sum: "$latest_stats.coordonnees_incorrectes" },
          autre_avec_contact: { $sum: { $ifNull: ["$latest_stats.autre_avec_contact", 0] } },
          cherche_contrat: { $sum: { $ifNull: ["$latest_stats.cherche_contrat", 0] } },
          reorientation: { $sum: { $ifNull: ["$latest_stats.reorientation", 0] } },
          ne_veut_pas_accompagnement: { $sum: { $ifNull: ["$latest_stats.ne_veut_pas_accompagnement", 0] } },
          ne_souhaite_pas_etre_recontacte: {
            $sum: { $ifNull: ["$latest_stats.ne_souhaite_pas_etre_recontacte", 0] },
          },
          deja_connu: { $sum: "$latest_stats.deja_connu" },
        },
      },
    ])
    .toArray();

  return stats;
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

// Borne inférieure pour limiter les scans de collection
const STATS_START_DATE = new Date("2025-02-01T00:00:00.000Z");

async function getEngagementStatsByRegion(evaluationDate: Date, startDate: Date) {
  const allEngagementStats = await missionLocaleStatsDb()
    .aggregate(
      [
        { $match: { computed_day: { $in: [evaluationDate, startDate], $gte: STATS_START_DATE } } },
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

async function getTraitementStatsByRegion(evaluationDate: Date, startDate: Date) {
  const allStats = (await missionLocaleStatsDb()
    .aggregate(
      [
        {
          $match: {
            computed_day: { $in: [evaluationDate, startDate], $gte: STATS_START_DATE },
          },
        },
        ...buildOrgLookupPipeline({ checkActivation: false }),
        {
          $group: {
            _id: { region: "$ml.adresse.region", date: "$computed_day" },
            a_traiter: { $sum: "$stats.a_traiter" },
            traites: { $sum: "$stats.traite" },
          },
        },
      ],
      { allowDiskUse: true }
    )
    .toArray()) as Array<{ _id: { region: string; date: Date }; a_traiter: number; traites: number }>;

  const traitementByRegionDate = new Map<
    string,
    { current: { a_traiter: number; traites: number }; previous: { a_traiter: number; traites: number } }
  >();

  allStats.forEach((stat) => {
    const regionCode = stat._id.region;
    const isCurrent = stat._id.date.getTime() === evaluationDate.getTime();

    if (!traitementByRegionDate.has(regionCode)) {
      traitementByRegionDate.set(regionCode, {
        current: { a_traiter: 0, traites: 0 },
        previous: { a_traiter: 0, traites: 0 },
      });
    }

    const entry = traitementByRegionDate.get(regionCode)!;
    if (isCurrent) {
      entry.current = { a_traiter: stat.a_traiter, traites: stat.traites };
    } else {
      entry.previous = { a_traiter: stat.a_traiter, traites: stat.traites };
    }
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
        traites_variation: calculatePercentage(traitement.current.traites, traitement.previous.traites),
      };
    });

  return {
    regions: regionsWithEngagement,
  };
};

export async function getStatsForPeriod(endDate: Date, missionLocaleIds?: ObjectId[]): Promise<IAggregatedStats> {
  try {
    const stats = await getLatestStatsPerML(endDate, missionLocaleIds);

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
      rdv_pris_decouverts: currentStats.rdv_pris_decouverts || 0,
      nouveau_projet: currentStats.nouveau_projet || 0,
      contacte_sans_retour: currentStats.contacte_sans_retour || 0,
      injoignables: currentStats.injoignables || 0,
      coordonnees_incorrectes: currentStats.coordonnees_incorrectes || 0,
      autre_avec_contact: currentStats.autre_avec_contact || 0,
      cherche_contrat: currentStats.cherche_contrat || 0,
      reorientation: currentStats.reorientation || 0,
      ne_veut_pas_accompagnement: currentStats.ne_veut_pas_accompagnement || 0,
      ne_souhaite_pas_etre_recontacte: currentStats.ne_souhaite_pas_etre_recontacte || 0,
      deja_connu: currentStats.deja_connu || 0,
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

  const buildTraitementPipeline = (matchFilter: object, sortOrder: 1 | -1 = -1) => [
    { $match: matchFilter },
    { $sort: { computed_day: sortOrder } },
    {
      $group: {
        _id: "$mission_locale_id",
        latest_stats: { $first: "$stats" },
      },
    },
    {
      $addFields: {
        injoignables: { $ifNull: ["$latest_stats.injoignables", 0] },
        coordonnees_incorrectes: { $ifNull: ["$latest_stats.coordonnees_incorrectes", 0] },
        cherche_contrat: { $ifNull: ["$latest_stats.cherche_contrat", 0] },
        reorientation: { $ifNull: ["$latest_stats.reorientation", 0] },
        ne_veut_pas_accompagnement: { $ifNull: ["$latest_stats.ne_veut_pas_accompagnement", 0] },
        ne_souhaite_pas_etre_recontacte: { $ifNull: ["$latest_stats.ne_souhaite_pas_etre_recontacte", 0] },
        autre_avec_contact: { $ifNull: ["$latest_stats.autre_avec_contact", 0] },
        rdv_pris_decouverts: { $ifNull: ["$latest_stats.rdv_pris_decouverts", 0] },
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
              "$ne_veut_pas_accompagnement",
              "$ne_souhaite_pas_etre_recontacte",
              "$cherche_contrat",
              "$reorientation",
              "$latest_stats.contacte_sans_retour",
              "$injoignables",
              "$coordonnees_incorrectes",
              "$autre_avec_contact",
            ],
          },
        },
        total_repondu: {
          $sum: {
            $add: [
              "$latest_stats.rdv_pris",
              "$latest_stats.nouveau_projet",
              "$ne_veut_pas_accompagnement",
              "$ne_souhaite_pas_etre_recontacte",
              "$cherche_contrat",
              "$reorientation",
              "$autre_avec_contact",
            ],
          },
        },
        total_accompagne: {
          $sum: "$rdv_pris_decouverts",
        },
      },
    },
  ];

  const latestMatchFilter = withMissionLocaleFilter(
    { computed_day: { $lte: endDate, $gte: getLatestStatsLowerBound(endDate) } },
    missionLocaleIds
  );
  const firstMatchFilter = withMissionLocaleFilter(
    { computed_day: { $gte: startDate, $lte: endDate } },
    missionLocaleIds
  );

  const [latestStatsResult] = (await missionLocaleStatsDb()
    .aggregate(buildTraitementPipeline(latestMatchFilter))
    .toArray()) as TraitementStatEntry[];

  const [firstStatsResult] = (await missionLocaleStatsDb()
    .aggregate(buildTraitementPipeline(firstMatchFilter, 1))
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

interface TraitementMLParams {
  period: StatsPeriod;
  region?: string;
  regions?: string[];
  page: number;
  limit: number;
  sort_by: string;
  sort_order: "asc" | "desc";
  search?: string;
}

export const getTraitementStatsByMissionLocale = async (params: TraitementMLParams) => {
  const { period, region, regions, page, limit, sort_by, sort_order, search } = params;
  const evaluationDate = normalizeToUTCDay(new Date());
  const startDate = calculateStartDate(period, evaluationDate);

  const sortFieldMap: Record<string, string> = {
    nom: "nom",
    total_jeunes: "total_jeunes",
    a_traiter: "a_traiter",
    traites: "traites",
    pourcentage_traites: "pourcentage_traites",
    derniere_activite: "derniere_activite",
    jours_depuis_activite: "jours_depuis_activite_sort",
  };

  const mongoSortField = sortFieldMap[sort_by] || "total_jeunes";
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
        ],
        as: "first_stats_entry",
      },
    },
    {
      $addFields: {
        latest_stats: { $arrayElemAt: ["$latest_stats_entry.stats", 0] },
        first_stats: {
          $ifNull: [
            { $arrayElemAt: ["$first_stats_entry.stats", 0] },
            { $arrayElemAt: ["$latest_stats_entry.stats", 0] },
          ],
        },
      },
    },
    { $unset: ["latest_stats_entry", "first_stats_entry"] },
    {
      $lookup: {
        from: "regions",
        localField: "adresse.region",
        foreignField: "code",
        as: "region_info",
      },
    },
    // Calculer les champs
    {
      $addFields: {
        total_jeunes: {
          $add: [{ $ifNull: ["$latest_stats.a_traiter", 0] }, { $ifNull: ["$latest_stats.traite", 0] }],
        },
        pourcentage_traites: {
          $round: [
            {
              $cond: [
                {
                  $eq: [
                    { $add: [{ $ifNull: ["$latest_stats.a_traiter", 0] }, { $ifNull: ["$latest_stats.traite", 0] }] },
                    0,
                  ],
                },
                0,
                {
                  $multiply: [
                    {
                      $divide: [
                        buildTotalTraitesV2Expression(),
                        {
                          $add: [{ $ifNull: ["$latest_stats.a_traiter", 0] }, { $ifNull: ["$latest_stats.traite", 0] }],
                        },
                      ],
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
            {
              $eq: [{ $add: [{ $ifNull: ["$first_stats.a_traiter", 0] }, { $ifNull: ["$first_stats.traite", 0] }] }, 0],
            },
            0,
            {
              $multiply: [
                {
                  $divide: [
                    buildTotalTraitesV2Expression("$first_stats"),
                    { $add: [{ $ifNull: ["$first_stats.a_traiter", 0] }, { $ifNull: ["$first_stats.traite", 0] }] },
                  ],
                },
                100,
              ],
            },
          ],
        },
        nom: { $trim: { input: "$nom" } },
        region_code: "$adresse.region",
        region_nom: { $ifNull: [{ $arrayElemAt: ["$region_info.nom", 0] }, "Région inconnue"] },
        a_traiter: { $ifNull: ["$latest_stats.a_traiter", 0] },
        traites: buildTotalTraitesV2Expression(),
        is_activated: { $ne: ["$activated_at", null] },
      },
    },
    {
      $addFields: {
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
              details: {
                rdv_pris: { $ifNull: ["$latest_stats.rdv_pris", 0] },
                nouveau_projet: { $ifNull: ["$latest_stats.nouveau_projet", 0] },
                contacte_sans_retour: { $ifNull: ["$latest_stats.contacte_sans_retour", 0] },
                injoignables: { $ifNull: ["$latest_stats.injoignables", 0] },
                coordonnees_incorrectes: { $ifNull: ["$latest_stats.coordonnees_incorrectes", 0] },
                autre_avec_contact: { $ifNull: ["$latest_stats.autre_avec_contact", 0] },
                cherche_contrat: { $ifNull: ["$latest_stats.cherche_contrat", 0] },
                reorientation: { $ifNull: ["$latest_stats.reorientation", 0] },
                ne_veut_pas_accompagnement: { $ifNull: ["$latest_stats.ne_veut_pas_accompagnement", 0] },
                ne_souhaite_pas_etre_recontacte: {
                  $ifNull: ["$latest_stats.ne_souhaite_pas_etre_recontacte", 0],
                },
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
        computed_day: { $lte: evaluationDate, $gte: getLatestStatsLowerBound(evaluationDate) },
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
        traites: { $sum: buildTotalTraitesV2Expression() },
        traites_brut: { $sum: "$latest_stats.traite" },
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
        total_jeunes: { $add: ["$a_traiter", "$traites_brut"] },
        pourcentage_traites: buildPercentageExpression("$traites", { $add: ["$a_traiter", "$traites_brut"] }),
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

const DEFAULT_MOTIFS = {
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

const DEFAULT_STATUTS_TRAITEMENT = {
  rdv_pris: 0,
  nouveau_projet: 0,
  contacte_sans_retour: 0,
  injoignables: 0,
  coordonnees_incorrectes: 0,
  cherche_contrat: 0,
  reorientation: 0,
  ne_veut_pas_accompagnement: 0,
  ne_souhaite_pas_etre_recontacte: 0,
  autre_avec_contact: 0,
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
      social_familial: buildCountIf("$organisme_data.motif", "SOCIAL_FAMILIAL"),
      reorientation: buildCountIf("$organisme_data.motif", "REORIENTATION"),
      recherche_emploi: buildCountIf("$organisme_data.motif", "RECHERCHE_EMPLOI"),
      autre: buildCountIf("$organisme_data.motif", "AUTRE"),
    },
  },
];

const NOUVEAU_PROJET_SITUATIONS = ["NOUVEAU_PROJET", "NOUVEAU_CONTRAT"] as const;

const TRAITES_V2_SITUATIONS = [
  "RDV_PRIS",
  ...NOUVEAU_PROJET_SITUATIONS,
  "CONTACTE_SANS_RETOUR",
  "INJOIGNABLE_APRES_RELANCES",
  "COORDONNEES_INCORRECT",
  "CHERCHE_CONTRAT",
  "REORIENTATION",
  "NE_VEUT_PAS_ACCOMPAGNEMENT",
  "NE_SOUHAITE_PAS_ETRE_RECONTACTE",
] as const;

const buildAutreAvecContactCondition = () => ({
  $and: [{ $eq: ["$situation", "AUTRE"] }, { $eq: [{ $ifNull: ["$probleme_type", null] }, null] }],
});

const STATUTS_TRAITEMENT_PIPELINE = [
  {
    $group: {
      _id: null,
      rdv_pris: buildCountIf("$situation", "RDV_PRIS"),
      nouveau_projet: {
        $sum: { $cond: [{ $in: ["$situation", NOUVEAU_PROJET_SITUATIONS] }, 1, 0] },
      },
      contacte_sans_retour: buildCountIf("$situation", "CONTACTE_SANS_RETOUR"),
      injoignables: buildCountIf("$situation", "INJOIGNABLE_APRES_RELANCES"),
      coordonnees_incorrectes: buildCountIf("$situation", "COORDONNEES_INCORRECT"),
      cherche_contrat: buildCountIf("$situation", "CHERCHE_CONTRAT"),
      reorientation: buildCountIf("$situation", "REORIENTATION"),
      ne_veut_pas_accompagnement: buildCountIf("$situation", "NE_VEUT_PAS_ACCOMPAGNEMENT"),
      ne_souhaite_pas_etre_recontacte: buildCountIf("$situation", "NE_SOUHAITE_PAS_ETRE_RECONTACTE"),
      autre_avec_contact: {
        $sum: { $cond: [buildAutreAvecContactCondition(), 1, 0] },
      },
      total_traites: {
        $sum: {
          $cond: [
            {
              $or: [{ $in: ["$situation", TRAITES_V2_SITUATIONS] }, buildAutreAvecContactCondition()],
            },
            1,
            0,
          ],
        },
      },
    },
  },
];

const getCfaPilotesOids = async () => {
  const cfaPilotes = (await organisationsDb()
    .find({
      type: "ORGANISME_FORMATION",
      ml_beta_activated_at: { $exists: true, $ne: null },
    })
    .toArray()) as IOrganisationOrganismeFormation[];

  return cfaPilotes
    .map((o) => (o.organisme_id ? new ObjectId(o.organisme_id) : null))
    .filter((id): id is ObjectId => id !== null);
};

const getRegionsActives = async (cfaPilotesOids: ObjectId[]) => {
  const organismesAvecRegion = await organismesDb()
    .find({ _id: { $in: cfaPilotesOids } }, { projection: { "adresse.region": 1 } })
    .toArray();

  return [...new Set(organismesAvecRegion.map((o) => o.adresse?.region).filter(Boolean))] as string[];
};

export const getAccompagnementConjointStats = async (
  region?: string,
  mlId?: string
): Promise<IAccompagnementConjointStats> => {
  const evaluationDate = normalizeToUTCDay(new Date());

  const cfaPilotesOids = await getCfaPilotesOids();
  const regionsActives = await getRegionsActives(cfaPilotesOids);

  const missionLocaleFilter = mlId
    ? { mission_locale_id: new ObjectId(mlId) }
    : region
      ? { mission_locale_id: { $in: await getMissionLocaleIdsByRegion(region) } }
      : {};

  const [accConjointStats] = await missionLocaleEffectifsDb()
    .aggregate([
      {
        $match: {
          "effectif_snapshot.organisme_id": { $in: cfaPilotesOids },
          ...missionLocaleFilter,
        },
      },
      {
        $facet: {
          totalJeunesRupturants: [{ $count: "count" }],
          dossiersPartages: [{ $match: { "organisme_data.acc_conjoint": true } }, { $count: "count" }],
          mlConcernees: [
            { $match: { "organisme_data.acc_conjoint": true } },
            { $group: { _id: "$mission_locale_id" } },
            { $count: "count" },
          ],
          cfaPartenaires: [
            { $match: { "organisme_data.acc_conjoint": true } },
            { $group: { _id: "$effectif_snapshot.organisme_id" } },
            { $count: "count" },
          ],
          motifs: [{ $match: { "organisme_data.acc_conjoint": true } }, ...MOTIFS_PIPELINE],
          statutsTraitement: [{ $match: { "organisme_data.acc_conjoint": true } }, ...STATUTS_TRAITEMENT_PIPELINE],
          dejaConnu: [
            { $match: { "organisme_data.acc_conjoint": true } },
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

  const totalJeunesRupturants = accConjointStats?.totalJeunesRupturants[0]?.count || 0;

  const totalDossiersPartages = accConjointStats?.dossiersPartages[0]?.count || 0;
  const mlConcernees = accConjointStats?.mlConcernees[0]?.count || 0;
  const cfaPartenairesCount = accConjointStats?.cfaPartenaires[0]?.count || 0;
  const motifs = { ...DEFAULT_MOTIFS, ...accConjointStats?.motifs[0] };
  const statutsTraitement = { ...DEFAULT_STATUTS_TRAITEMENT, ...accConjointStats?.statutsTraitement[0] };
  const dejaConnuData = accConjointStats?.dejaConnu[0] || { count: 0, total: 0 };

  const totalDossiersTraites = statutsTraitement.total_traites;
  const pourcentageTraites =
    totalDossiersPartages > 0 ? Math.round((totalDossiersTraites / totalDossiersPartages) * 100) : 0;

  return {
    cfaPartenaires: cfaPartenairesCount,
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
      social_familial: motifs.social_familial || 0,
      reorientation: motifs.reorientation || 0,
      recherche_emploi: motifs.recherche_emploi || 0,
      autre: motifs.autre || 0,
    },
    statutsTraitement: {
      rdv_pris: statutsTraitement.rdv_pris || 0,
      nouveau_projet: statutsTraitement.nouveau_projet || 0,
      contacte_sans_retour: statutsTraitement.contacte_sans_retour || 0,
      injoignables: statutsTraitement.injoignables || 0,
      coordonnees_incorrectes: statutsTraitement.coordonnees_incorrectes || 0,
      autre_avec_contact: statutsTraitement.autre_avec_contact || 0,
      cherche_contrat: statutsTraitement.cherche_contrat || 0,
      reorientation: statutsTraitement.reorientation || 0,
      ne_veut_pas_accompagnement: statutsTraitement.ne_veut_pas_accompagnement || 0,
      ne_souhaite_pas_etre_recontacte: statutsTraitement.ne_souhaite_pas_etre_recontacte || 0,
    },
    dejaConnu: dejaConnuData.count,
    totalPourDejaConnu: dejaConnuData.total,
    evaluationDate,
  };
};

export async function getDeploymentStats(period: StatsPeriod = "30days") {
  const evaluationDate = normalizeToUTCDay(new Date());

  const [summary, regional] = await Promise.all([getSummaryStats(evaluationDate, period), getRegionalStats(period)]);

  const engagedMlCount = regional.regions.reduce((sum, r) => sum + r.ml_engagees, 0);
  const previousEngagedMlCount = regional.regions.reduce((sum, r) => sum + (r.ml_engagees - r.ml_engagees_delta), 0);

  return {
    summary: {
      mlCount: summary.mlCount,
      activatedMlCount: summary.activatedMlCount,
      previousActivatedMlCount: summary.previousActivatedMlCount,
      engagedMlCount,
      previousEngagedMlCount,
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
    injoignables: createStatWithVariation(currentStats.injoignables, previousStats.injoignables),
    coordonnees_incorrectes: createStatWithVariation(
      currentStats.coordonnees_incorrectes,
      previousStats.coordonnees_incorrectes
    ),
    autre_avec_contact: createStatWithVariation(currentStats.autre_avec_contact, previousStats.autre_avec_contact),
    cherche_contrat: createStatWithVariation(currentStats.cherche_contrat, previousStats.cherche_contrat),
    reorientation: createStatWithVariation(currentStats.reorientation, previousStats.reorientation),
    ne_veut_pas_accompagnement: createStatWithVariation(
      currentStats.ne_veut_pas_accompagnement,
      previousStats.ne_veut_pas_accompagnement
    ),
    ne_souhaite_pas_etre_recontacte: createStatWithVariation(
      currentStats.ne_souhaite_pas_etre_recontacte,
      previousStats.ne_souhaite_pas_etre_recontacte
    ),
    deja_connu: currentStats.deja_connu,
    total: currentStats.total_traites,
  };

  const neSouhaiteCurrent =
    currentStats.ne_veut_pas_accompagnement +
    currentStats.ne_souhaite_pas_etre_recontacte +
    currentStats.cherche_contrat +
    currentStats.reorientation;
  const neSouhaitePrevious =
    previousStats.ne_veut_pas_accompagnement +
    previousStats.ne_souhaite_pas_etre_recontacte +
    previousStats.cherche_contrat +
    previousStats.reorientation;

  const injoignableCurrent = currentStats.injoignables + currentStats.coordonnees_incorrectes;
  const injoignablePrevious = previousStats.injoignables + previousStats.coordonnees_incorrectes;

  const totalV2Current =
    currentStats.rdv_pris +
    currentStats.nouveau_projet +
    neSouhaiteCurrent +
    currentStats.contacte_sans_retour +
    injoignableCurrent +
    currentStats.autre_avec_contact;

  const detailsTraitesV2: IDetailsDossiersTraitesV2 = {
    rdv_pris: createStatWithVariation(currentStats.rdv_pris, previousStats.rdv_pris),
    projet_pro_securise: createStatWithVariation(currentStats.nouveau_projet, previousStats.nouveau_projet),
    ne_souhaite_pas_accompagnement: createStatWithVariation(neSouhaiteCurrent, neSouhaitePrevious),
    a_recontacter: createStatWithVariation(currentStats.contacte_sans_retour, previousStats.contacte_sans_retour),
    injoignable: createStatWithVariation(injoignableCurrent, injoignablePrevious),
    autre: createStatWithVariation(currentStats.autre_avec_contact, previousStats.autre_avec_contact),
    total: totalV2Current,
  };

  return {
    details: detailsTraites,
    detailsV2: detailsTraitesV2,
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

interface TraitementExportParams {
  region?: string;
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

const buildExportBasePipeline = (evaluationDate: Date, region?: string) => [
  { $match: { computed_day: { $lte: evaluationDate, $gte: getLatestStatsLowerBound(evaluationDate) } } },
  { $sort: { computed_day: -1 as const } },
  { $group: { _id: "$mission_locale_id", latest_stats: { $first: "$stats" } } },
  { $lookup: { from: "organisations", localField: "_id", foreignField: "_id", as: "ml" } },
  { $unwind: "$ml" },
  {
    $match: {
      "ml.type": "MISSION_LOCALE",
      ...(region && { "ml.adresse.region": region }),
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

export const getTraitementExportData = async (params: TraitementExportParams) => {
  const { region } = params;
  const evaluationDate = normalizeToUTCDay(new Date());

  const basePipeline = buildExportBasePipeline(evaluationDate, region);

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

  const collabMlFilter = region ? { mission_locale_id: { $in: await getMissionLocaleIdsByRegion(region) } } : {};

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

  const [mlDataRaw, regionData, collabData] = await Promise.all([
    missionLocaleStatsDb().aggregate(mlPipeline, { allowDiskUse: true }).toArray(),
    missionLocaleStatsDb().aggregate(regionPipeline, { allowDiskUse: true }).toArray(),
    missionLocaleEffectifsDb().aggregate(collabByMlPipeline).toArray(),
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
    regionData: regionDataWithCollab,
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

export const getClassifierStats = async (period: StatsPeriod = "all"): Promise<IClassifierStats> => {
  const evaluationDate = normalizeToUTCDay(new Date());
  const startDate = await calculateStartDateAsync(period, evaluationDate);

  const baseMatch: Record<string, unknown> = { soft_deleted: { $ne: true } };
  if (period !== "all") {
    baseMatch.created_at = { $gte: startDate, $lte: evaluationDate };
  }

  const pipeline = [
    { $match: baseMatch },
    {
      $facet: {
        feedback: [
          { $match: { "classification_reponse_appel.feedback": { $exists: true, $ne: null } } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              reactivite_oui: {
                $sum: { $cond: [{ $eq: ["$classification_reponse_appel.feedback.meilleure_reactivite", true] }, 1, 0] },
              },
              reactivite_non: {
                $sum: {
                  $cond: [{ $eq: ["$classification_reponse_appel.feedback.meilleure_reactivite", false] }, 1, 0],
                },
              },
              confiance_sum: { $sum: "$classification_reponse_appel.feedback.confiance_indice" },
              utilite_sum: { $sum: "$classification_reponse_appel.feedback.utilite_indice" },
            },
          },
        ],
        feedback_confiance: [
          { $match: { "classification_reponse_appel.feedback": { $exists: true, $ne: null } } },
          { $group: { _id: "$classification_reponse_appel.feedback.confiance_indice", count: { $sum: 1 } } },
        ],
        feedback_utilite: [
          { $match: { "classification_reponse_appel.feedback": { $exists: true, $ne: null } } },
          { $group: { _id: "$classification_reponse_appel.feedback.utilite_indice", count: { $sum: 1 } } },
        ],
        situations_co: [
          {
            $match: {
              "classification_reponse_appel.score": { $gte: CONTACT_OPPORTUN_SCORE_THRESHOLD },
              "classification_reponse_appel.feedback": { $exists: true, $ne: null },
              situation: { $ne: null },
            },
          },
          { $group: { _id: "$situation", count: { $sum: 1 } } },
        ],
        situations_autres: [
          {
            $match: {
              "classification_reponse_appel.feedback": { $exists: true, $ne: null },
              $or: [
                { "classification_reponse_appel.score": { $lt: CONTACT_OPPORTUN_SCORE_THRESHOLD } },
                { classification_reponse_appel: { $exists: false } },
              ],
              situation: { $ne: null },
            },
          },
          { $group: { _id: "$situation", count: { $sum: 1 } } },
        ],
        scoring: [
          { $match: { "classification_reponse_appel.score": { $exists: true } } },
          {
            $group: {
              _id: null,
              total_scored: { $sum: 1 },
              total_contact_opportun: {
                $sum: {
                  $cond: [{ $gte: ["$classification_reponse_appel.score", CONTACT_OPPORTUN_SCORE_THRESHOLD] }, 1, 0],
                },
              },
              score_sum: { $sum: "$classification_reponse_appel.score" },
            },
          },
        ],
      },
    },
  ];

  const [result] = await missionLocaleEffectifsDb().aggregate(pipeline, { allowDiskUse: true }).toArray();

  const fb = result?.feedback?.[0];
  const fbTotal = fb?.total || 0;

  const buildDistribution = (data: Array<{ _id: number; count: number }>) => {
    const dist = [0, 0, 0, 0, 0, 0];
    for (const item of data || []) {
      if (item._id >= 0 && item._id <= 5) dist[item._id] = item.count;
    }
    return dist;
  };

  const confianceDist = buildDistribution(result?.feedback_confiance);
  const utiliteDist = buildDistribution(result?.feedback_utilite);

  const buildSituationMap = (data: Array<{ _id: string; count: number }>) => {
    const situationKeys = new Set([
      "rdv_pris",
      "nouveau_projet",
      "deja_accompagne",
      "contacte_sans_retour",
      "coordonnees_incorrect",
      "injoignable_apres_relances",
      "autre",
    ]);
    const map = {
      rdv_pris: 0,
      nouveau_projet: 0,
      deja_accompagne: 0,
      contacte_sans_retour: 0,
      coordonnees_incorrect: 0,
      injoignable_apres_relances: 0,
      autre: 0,
      total: 0,
    };
    for (const item of data || []) {
      const key = item._id?.toLowerCase();
      if (situationKeys.has(key)) (map as Record<string, number>)[key] += item.count;
      else map.autre += item.count;
      map.total += item.count;
    }
    return map;
  };

  const scoring = result?.scoring?.[0];

  return {
    feedback: {
      total: fbTotal,
      meilleure_reactivite: { oui: fb?.reactivite_oui || 0, non: fb?.reactivite_non || 0 },
      confiance_indice: {
        distribution: confianceDist,
        moyenne: fbTotal > 0 ? Math.round(((fb?.confiance_sum || 0) / fbTotal) * 10) / 10 : 0,
      },
      utilite_indice: {
        distribution: utiliteDist,
        moyenne: fbTotal > 0 ? Math.round(((fb?.utilite_sum || 0) / fbTotal) * 10) / 10 : 0,
      },
    },
    situations: {
      contact_opportun: buildSituationMap(result?.situations_co),
      autres: buildSituationMap(result?.situations_autres),
    },
    scoring: {
      total_scored: scoring?.total_scored || 0,
      total_contact_opportun: scoring?.total_contact_opportun || 0,
      score_moyen: scoring?.total_scored > 0 ? Math.round((scoring.score_sum / scoring.total_scored) * 100) / 100 : 0,
    },
  };
};
