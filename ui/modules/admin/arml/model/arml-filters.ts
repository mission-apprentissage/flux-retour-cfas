import { stripEmptyFields } from "@/common/utils/misc";

export interface ARMLFilters {
  arml: string[];
}

export interface ARMLFiltersQuery {
  arml?: string;
}

export function parseARMLFiltersFromQuery(query: ARMLFiltersQuery): ARMLFilters {
  return {
    arml: query.arml?.split(",") ?? [],
  };
}

export function convertARMLFiltersToQuery(armlFilters: Partial<ARMLFilters>): Partial<ARMLFiltersQuery> {
  return stripEmptyFields({
    arml: armlFilters.arml?.join(","),
  });
}
