/**
 * Helpers et builders de pipelines MongoDB pour les statistiques Mission Locale
 *
 * Ce fichier centralise les fonctions utilitaires et les constructeurs de pipelines
 * MongoDB utilisés pour calculer les statistiques des Missions Locales.
 */

import { ObjectId } from "bson";
import type { IAggregatedStats, StatsPeriod } from "shared/models/data/nationalStats.model";
import { normalizeToUTCDay } from "shared/utils/date";
import { calculatePercentage } from "shared/utils/stats";

import { missionLocaleStatsDb, organisationsDb } from "@/common/model/collections";

/**
 * Nombre de points sur les graphiques time series
 */
export const TIME_SERIES_POINTS_COUNT = 6;

/**
 * Seuil d'engagement des Missions Locales (70%)
 * Une ML est considérée "engagée" si elle a traité au moins 70% de ses dossiers
 */
export const ENGAGEMENT_THRESHOLD = 0.7;

/** Stats par défaut quand aucune donnée n'est disponible */
export const EMPTY_STATS: IAggregatedStats & {
  total_contacte: number;
  total_repondu: number;
  total_accompagne: number;
} = {
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

/**
 * Construit un pipeline de lookup pour récupérer les organisations liées
 */
export const buildOrgLookupPipeline = (options: { checkActivation?: boolean; localField?: string } = {}) => {
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

/**
 * Construit un pipeline de lookup pour récupérer les informations de région
 */
export const buildRegionLookupPipeline = (localField = "_id") => [
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

/** Construit une expression MongoDB pour calculer un pourcentage arrondi */
export const buildPercentageExpression = (numerator: MongoExpression, denominator: MongoExpression) => ({
  $cond: [
    { $eq: [denominator, 0] },
    0,
    {
      $round: [{ $multiply: [{ $divide: [numerator, denominator] }, 100] }, 0],
    },
  ],
});

/**
 * Builder pour les champs de traitement utilisés dans les agrégations
 * Centralise la logique de calcul de total_contacte, total_repondu, total_accompagne
 */
export const buildTraitementFields = () => ({
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
  total_accompagne: {
    $sum: {
      $add: ["$stats.rdv_pris", "$stats.deja_accompagne"],
    },
  },
});

/**
 * Récupère les IDs des Missions Locales d'une région donnée
 */
export const getMissionLocaleIdsByRegion = async (region: string): Promise<ObjectId[]> => {
  const mls = await organisationsDb()
    .find(
      {
        type: "MISSION_LOCALE",
        "adresse.region": region,
        activated_at: { $exists: true, $ne: null },
      },
      { projection: { _id: 1 } }
    )
    .toArray();

  return mls.map((ml) => ml._id);
};

/**
 * Ajoute un filtre sur les IDs de Mission Locale si fournis
 */
export const withMissionLocaleFilter = <T extends Record<string, unknown>>(
  filter: T,
  missionLocaleIds?: ObjectId[]
): T & { mission_locale_id?: { $in: ObjectId[] } } => {
  if (missionLocaleIds && missionLocaleIds.length > 0) {
    return { ...filter, mission_locale_id: { $in: missionLocaleIds } };
  }
  return filter;
};

/**
 * Récupère la date la plus ancienne des statistiques
 */
export const getEarliestDate = async () => {
  const earliestDate = await missionLocaleStatsDb().findOne(
    {},
    { sort: { computed_day: 1 }, projection: { computed_day: 1 } }
  );

  return earliestDate?.computed_day || null;
};

/**
 * Calcule la date de début en fonction de la période
 */
export function calculateStartDate(period: StatsPeriod, referenceDate: Date, earliestDate?: Date): Date {
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

/**
 * Calcule la date de début de manière asynchrone (récupère earliestDate si nécessaire)
 */
export async function calculateStartDateAsync(period: StatsPeriod, referenceDate: Date): Promise<Date> {
  if (period === "all") {
    const earliestDate = await getEarliestDate();
    return calculateStartDate(period, referenceDate, earliestDate || undefined);
  }
  return calculateStartDate(period, referenceDate);
}

/**
 * Crée un objet IStatWithVariation à partir de valeurs courante et précédente
 */
export function createStatWithVariation(current: number, previous: number) {
  return {
    current,
    variation: calculatePercentage(current, previous),
  };
}

/**
 * Construit un pipeline pour les stats cumulatives jusqu'à une date donnée
 */
export const buildCumulativeStatsPipeline = (targetDate: Date, missionLocaleIds?: ObjectId[]) => {
  const matchFilter = withMissionLocaleFilter({ computed_day: { $lte: targetDate } }, missionLocaleIds);

  return [
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
        total_traites: { $sum: "$latest_stats.traite" },
        total_a_traiter: { $sum: "$latest_stats.a_traiter" },
      },
    },
  ];
};
