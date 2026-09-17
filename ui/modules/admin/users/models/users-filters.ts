import { stripEmptyFields } from "@/common/utils/misc";

export interface UsersFilters {
  type_utilisateur: string[];
  account_status: string[];
  reseaux: string[];
  departements: string[];
  regions: string[];
}

export interface UsersFiltersQuery {
  type_utilisateur?: string;
  account_status?: string;
  reseaux?: string;
  departements?: string;
  regions?: string;
}

export function parseUsersFiltersFromQuery(query: UsersFiltersQuery): UsersFilters {
  return {
    type_utilisateur: query.type_utilisateur?.split(",") ?? [],
    account_status: query.account_status?.split(",") ?? [],
    reseaux: query.reseaux?.split(",") ?? [],
    departements: query.departements?.split(",") ?? [],
    regions: query.regions?.split(",") ?? [],
  };
}

export function convertUsersFiltersToQuery(organismesFilters: Partial<UsersFilters>): Partial<UsersFiltersQuery> {
  return stripEmptyFields({
    type_utilisateur: organismesFilters.type_utilisateur?.join(","),
    account_status: organismesFilters.account_status?.join(","),
    reseaux: organismesFilters.reseaux?.join(","),
    departements: organismesFilters.departements?.join(","),
    regions: organismesFilters.regions?.join(","),
  });
}
