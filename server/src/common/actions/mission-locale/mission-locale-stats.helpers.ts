/**
 * Helpers et builders de pipelines MongoDB pour les statistiques Mission Locale
 *
 * Ce fichier centralise les fonctions utilitaires et les constructeurs de pipelines
 * MongoDB utilisés pour calculer les statistiques des Missions Locales.
 */

import { ObjectId } from "bson";
import type {
  ICollabSegmentStats,
  IMissionLocaleStatsSegments,
  ISegmentStats,
} from "shared/models/data/missionLocaleStats.model";
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
export const EMPTY_STATS: IAggregatedStats = {
  total: 0,
  total_a_traiter: 0,
  total_traites: 0,
  rdv_pris: 0,
  rdv_pris_decouverts: 0,
  nouveau_projet: 0,
  contacte_sans_retour: 0,
  injoignables: 0,
  coordonnees_incorrectes: 0,
  autre_avec_contact: 0,
  autre: 0,
  deja_accompagne: 0,
  cherche_contrat: 0,
  reorientation: 0,
  ne_veut_pas_accompagnement: 0,
  ne_souhaite_pas_etre_recontacte: 0,
  deja_connu: 0,
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
 * Récupère les IDs des Missions Locales d'une région donnée
 */
export const getMissionLocaleIdsByRegion = async (region: string): Promise<ObjectId[]> => {
  const mls = await organisationsDb()
    .find(
      {
        type: "MISSION_LOCALE",
        "adresse.region": region,
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
  if (missionLocaleIds === undefined) {
    return filter;
  }

  return { ...filter, mission_locale_id: { $in: missionLocaleIds } };
};

/**
 * Récupère la date la plus ancienne des statistiques
 */
const getEarliestDate = async () => {
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

export type ISituationCounters = {
  rdv_pris: number;
  nouveau_projet: number;
  deja_accompagne: number;
  contacte_sans_retour: number;
  injoignables: number;
  coordonnees_incorrectes: number;
  autre: number;
  cherche_contrat: number;
  reorientation: number;
  ne_veut_pas_accompagnement: number;
  ne_souhaite_pas_etre_recontacte: number;
  autre_avec_contact: number;
};

export type ISituationBuckets = {
  rdv_pris: number;
  projet_pro_securise: number;
  ne_souhaite_pas_accompagnement: number;
  a_recontacter: number;
  injoignable: number;
  autre: number;
  autre_avec_contact: number;
  repondu: number;
};

export const buildSituationBuckets = (counters: ISituationCounters): ISituationBuckets => {
  const ne_souhaite_pas_accompagnement =
    counters.ne_veut_pas_accompagnement +
    counters.ne_souhaite_pas_etre_recontacte +
    counters.cherche_contrat +
    counters.reorientation;

  return {
    rdv_pris: counters.rdv_pris,
    projet_pro_securise: counters.nouveau_projet,
    ne_souhaite_pas_accompagnement,
    a_recontacter: counters.contacte_sans_retour,
    injoignable: counters.injoignables + counters.coordonnees_incorrectes,
    autre: counters.autre + counters.deja_accompagne,
    autre_avec_contact: counters.autre_avec_contact,
    repondu: counters.rdv_pris + counters.nouveau_projet + ne_souhaite_pas_accompagnement + counters.autre_avec_contact,
  };
};

export type ISegmentRawCounters = ISituationCounters & {
  total: number;
  a_traiter: number;
  traite: number;
  rdv_pris_decouverts: number;
  deja_connu_accompagne: number;
};

export type ICollabSegmentRawCounters = ISegmentRawCounters & {
  situation_rupture: number;
  situation_abandon: number;
  situation_prevention_inevitable: number;
  situation_prevention_tres_eleve: number;
  situation_prevention_modere: number;
  situation_besoin_aide_hors_rupture: number;
  delai_premiere_activite_jours_total: number;
  delai_premiere_activite_count: number;
};

export const toSegmentStats = (raw: ISegmentRawCounters): ISegmentStats => ({
  total: raw.total,
  a_traiter: raw.a_traiter,
  traite: raw.traite,
  rdv_pris_decouverts: raw.rdv_pris_decouverts,
  deja_connu_accompagne: raw.deja_connu_accompagne,
  ...buildSituationBuckets(raw),
});

export const toCollabSegmentStats = (raw: ICollabSegmentRawCounters): ICollabSegmentStats => ({
  ...toSegmentStats(raw),
  situation_rupture: raw.situation_rupture,
  situation_abandon: raw.situation_abandon,
  situation_prevention_inevitable: raw.situation_prevention_inevitable,
  situation_prevention_tres_eleve: raw.situation_prevention_tres_eleve,
  situation_prevention_modere: raw.situation_prevention_modere,
  situation_besoin_aide_hors_rupture: raw.situation_besoin_aide_hors_rupture,
  delai_premiere_activite_jours_total: raw.delai_premiere_activite_jours_total,
  delai_premiere_activite_count: raw.delai_premiere_activite_count,
});

export const EMPTY_SEGMENT_STATS: ISegmentStats = {
  total: 0,
  a_traiter: 0,
  traite: 0,
  repondu: 0,
  rdv_pris: 0,
  rdv_pris_decouverts: 0,
  projet_pro_securise: 0,
  ne_souhaite_pas_accompagnement: 0,
  a_recontacter: 0,
  injoignable: 0,
  autre: 0,
  autre_avec_contact: 0,
  deja_connu_accompagne: 0,
};

export const EMPTY_COLLAB_SEGMENT_STATS: ICollabSegmentStats = {
  ...EMPTY_SEGMENT_STATS,
  situation_rupture: 0,
  situation_abandon: 0,
  situation_prevention_inevitable: 0,
  situation_prevention_tres_eleve: 0,
  situation_prevention_modere: 0,
  situation_besoin_aide_hors_rupture: 0,
  delai_premiere_activite_jours_total: 0,
  delai_premiere_activite_count: 0,
};

export const buildEmptySegments = (): IMissionLocaleStatsSegments => ({
  rupture: { ...EMPTY_SEGMENT_STATS },
  collab: { ...EMPTY_COLLAB_SEGMENT_STATS },
});

export const buildTotalTraitesV2Expression = (statsPath = "$latest_stats") => ({
  $ifNull: [`${statsPath}.traite`, 0],
});

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
 * Nombre de jours de lookback pour les requêtes "latest per ML".
 * Les stats sont calculées quotidiennement pour toutes les MLs,
 * donc 30 jours est une borne sûre même en cas de panne du job.
 */
const LATEST_STATS_LOOKBACK_DAYS = 30;

export const getLatestStatsLowerBound = (referenceDate: Date): Date => {
  const bound = new Date(referenceDate);
  bound.setUTCDate(bound.getUTCDate() - LATEST_STATS_LOOKBACK_DAYS);
  return normalizeToUTCDay(bound);
};

/**
 * Construit un pipeline pour les stats cumulatives jusqu'à une date donnée
 */
export const buildCumulativeStatsPipeline = (targetDate: Date, missionLocaleIds?: ObjectId[]) => {
  const matchFilter = withMissionLocaleFilter(
    { computed_day: { $lte: targetDate, $gte: getLatestStatsLowerBound(targetDate) } },
    missionLocaleIds
  );

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
        total_traites: { $sum: buildTotalTraitesV2Expression() },
        total_a_traiter: { $sum: "$latest_stats.a_traiter" },
      },
    },
  ];
};
