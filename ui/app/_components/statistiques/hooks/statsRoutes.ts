import { zPublicStatsPeriod, type StatsSegment } from "shared/models/data/nationalStats.model";

import type { Period } from "../ui/PeriodSelector";

export const PUBLIC_STATS_BASE = "/api/v1/mission-locale/stats";
export const INDICATEURS_ML_BASE = "/api/v1/organisation/indicateurs-ml";

/**
 * Périmètre d'une lecture de stats par segment. `isPublic` force les routes anonymes
 * (nationales) ; sinon les routes territoriales, scopées par `region`, `mlId` ou `national`.
 */
export interface SegmentStatsParams {
  period: Period;
  segment: StatsSegment;
  region?: string;
  departement?: string;
  mlId?: string;
  national?: boolean;
  isPublic?: boolean;
}

export interface StatsRequest {
  url: string;
  params: Record<string, unknown>;
}

/** Les périodes ajoutées pour les pages connectées (6 mois, depuis janvier) ne sont pas servies par l'API publique. */
const isPublicPeriod = (period: Period) => zPublicStatsPeriod.safeParse(period).success;

const territorialParams = ({ period, segment, region, departement, mlId, national }: SegmentStatsParams) => ({
  period,
  segment,
  ...(region && { region }),
  ...(departement && { departement }),
  ...(mlId && { ml_id: mlId }),
  ...(national && { national: true }),
});

/**
 * Sans périmètre (ni région ni ML), les cartes de l'entonnoir sont nationales : la route publique suffit, connecté ou
 * non, sauf pour une période qu'elle ne sert pas, lue alors sur la route territoriale nationale.
 */
export function buildTraitementRequest(params: SegmentStatsParams): StatsRequest {
  const { period, segment, region, mlId, isPublic } = params;
  if (isPublic || (!region && !mlId && isPublicPeriod(period))) {
    return { url: `${PUBLIC_STATS_BASE}/traitement`, params: { period, segment } };
  }
  return {
    url: `${INDICATEURS_ML_BASE}/traitement`,
    params: territorialParams({ ...params, national: params.national || (!region && !mlId) }),
  };
}

/** Graphes rupturants / dossiers traités : route anonyme nationale en public, sinon route territoriale scopée. */
export function buildSegmentStatsRequest(
  resource: "rupturants" | "dossiers-traites",
  params: SegmentStatsParams
): StatsRequest {
  return params.isPublic
    ? { url: `${PUBLIC_STATS_BASE}/${resource}`, params: { period: params.period, segment: params.segment } }
    : { url: `${INDICATEURS_ML_BASE}/stats/${resource}`, params: territorialParams(params) };
}

export type CollaborationStatsParams = Omit<SegmentStatsParams, "segment">;

/** Bloc collaboration : route anonyme nationale en public, sinon route territoriale scopée. */
export function buildCollaborationsRequest(params: CollaborationStatsParams): StatsRequest {
  if (params.isPublic) {
    return { url: `${PUBLIC_STATS_BASE}/collaborations`, params: { period: params.period } };
  }
  const { period, region, departement, mlId, national } = params;
  return {
    url: `${INDICATEURS_ML_BASE}/stats/collaborations`,
    params: {
      period,
      ...(region && { region }),
      ...(departement && { departement }),
      ...(mlId && { ml_id: mlId }),
      ...(national && { national: true }),
    },
  };
}

/**
 * Sans région, le déploiement national passe par la route publique, ou par la route territoriale nationale pour une
 * période qu'elle ne sert pas ; avec une région, par la route territoriale scopée.
 */
export function buildSyntheseRequest(
  resource: "deployment" | "regions",
  period: Period,
  region?: string,
  departement?: string
): StatsRequest {
  if (region) {
    return {
      url: `${INDICATEURS_ML_BASE}/synthese/${resource}`,
      params: { period, region, ...(departement && { departement }) },
    };
  }
  return isPublicPeriod(period)
    ? { url: `${PUBLIC_STATS_BASE}/synthese/${resource}`, params: { period } }
    : { url: `${INDICATEURS_ML_BASE}/synthese/${resource}`, params: { period, national: true } };
}
