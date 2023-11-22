import { stripEmptyFields } from "@/common/utils/misc";

import { UserNormalized } from "./users";

export interface UsersFilters {
  type_utilisateur: string[];
  account_status: string[];
}

export interface UsersFiltersQuery {
  type_utilisateur?: string;
  account_status?: string;
}

export function parseUsersFiltersFromQuery(query: UsersFiltersQuery): UsersFilters {
  return {
    type_utilisateur: query.type_utilisateur?.split(",") ?? [],
    account_status: query.account_status?.split(",") ?? [],
  };
}

export function convertUsersFiltersToQuery(organismesFilters: Partial<UsersFilters>): Partial<UsersFiltersQuery> {
  return stripEmptyFields({
    type_utilisateur: organismesFilters.type_utilisateur?.join(","),
    account_status: organismesFilters.account_status?.join(","),
  });
}

export function filterUsersArrayFromUsersFilters(
  users: UserNormalized[],
  usersFilters: Partial<UsersFilters>
): UserNormalized[] {
  let filteredUsers = users;

  if (usersFilters.type_utilisateur?.length && usersFilters.type_utilisateur?.length > 0)
    filteredUsers = filteredUsers?.filter((item) => usersFilters.type_utilisateur?.includes(item.userType));

  if (usersFilters.account_status?.length && usersFilters.account_status?.length > 0)
    filteredUsers = filteredUsers?.filter((item) => usersFilters.account_status?.includes(item.account_status));

  return filteredUsers;
}
