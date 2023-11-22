import { stripEmptyFields } from "@/common/utils/misc";

export interface UsersFilters {
  type_utilisateur: string[];
}

export interface UsersFiltersQuery {
  type_utilisateur?: string;
}

export function parseUsersFiltersFromQuery(query: UsersFiltersQuery): UsersFilters {
  return {
    type_utilisateur: query.type_utilisateur?.split(",") ?? [],
  };
}

export function convertUsersFiltersToQuery(organismesFilters: Partial<UsersFilters>): Partial<UsersFiltersQuery> {
  return stripEmptyFields({
    type_utilisateur: organismesFilters.type_utilisateur?.join(","),
  });
}

export function filterUsersArrayFromUsersFilters(users, usersFilters: Partial<UsersFilters>) {
  let filteredUsers = users;

  if (usersFilters.type_utilisateur?.length && usersFilters.type_utilisateur?.length > 0)
    filteredUsers = filteredUsers?.filter((item) => usersFilters.type_utilisateur?.includes(item.userType));

  return filteredUsers;
}
