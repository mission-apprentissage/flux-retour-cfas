import { stripEmptyFields } from "@/common/utils/misc";

export interface MissionLocaleFilters {
  rqth_only: boolean;
  mineur_only: boolean;
}

export interface MissionLocaleFiltersQuery {
  rqth_only?: string;
  mineur_only?: string;
}

export function parseMissionLocaleFiltersFromQuery(query: MissionLocaleFiltersQuery): MissionLocaleFilters {
  return {
    rqth_only: query.rqth_only === "true",
    mineur_only: query.mineur_only === "true",
  };
}

export function convertMissionLocaleFiltersToQuery(
  missionLocaleFilters: Partial<MissionLocaleFilters>
): Partial<MissionLocaleFiltersQuery> {
  return stripEmptyFields({
    rqth_only: missionLocaleFilters.rqth_only ? "true" : "false",
    mineur_only: missionLocaleFilters.mineur_only ? "true" : "false",
  });
}
