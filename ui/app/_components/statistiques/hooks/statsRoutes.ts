import type { StatsSegment } from "shared/models/data/nationalStats.model";

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
  mlId?: string;
  national?: boolean;
  isPublic?: boolean;
}

export interface StatsRequest {
  url: string;
  params: Record<string, unknown>;
}

const territorialParams = ({ period, segment, region, mlId, national }: SegmentStatsParams) => ({
  period,
  segment,
  ...(region && { region }),
  ...(mlId && { ml_id: mlId }),
  ...(national && { national: true }),
});

/** Sans région, les cartes de l'entonnoir sont nationales : la route publique suffit, connecté ou non. */
export function buildTraitementRequest({ period, segment, region }: SegmentStatsParams): StatsRequest {
  return region
    ? { url: `${INDICATEURS_ML_BASE}/traitement`, params: { period, region, segment } }
    : { url: `${PUBLIC_STATS_BASE}/traitement`, params: { period, segment } };
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
