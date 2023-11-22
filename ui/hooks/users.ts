import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useMemo } from "react";

import { _get, _post, _put } from "@/common/httpClient";
import { UsersPaginated } from "@/common/internal/User";
import { UserNormalized, toUserNormalized } from "@/modules/admin/users/models/users";
import {
  UsersFiltersQuery,
  filterUsersArrayFromUsersFilters,
  parseUsersFiltersFromQuery,
} from "@/modules/admin/users/models/users-filters";

export function useUsers() {
  const NO_LIMIT = 10_000;

  const {
    data: usersPaginated,
    refetch: refetchUsers,
    isLoading,
  } = useQuery<UsersPaginated, any>(["admin/users"], () =>
    _get("/api/v1/admin/users/", {
      params: {
        page: 1,
        limit: NO_LIMIT,
      },
    })
  );

  const allUsers = useMemo(() => {
    if (!usersPaginated) return [];
    return usersPaginated.data.map((user) => toUserNormalized(user));
  }, [usersPaginated]);

  return {
    isLoading,
    refetchUsers,
    allUsers,
  };
}

export function useUsersFiltered(users: UserNormalized[]) {
  const router = useRouter();

  const filteredUsers = useMemo(() => {
    return users
      ? filterUsersArrayFromUsersFilters(
          users,
          parseUsersFiltersFromQuery(router.query as unknown as UsersFiltersQuery)
        )
      : [];
  }, [users, router.query]);

  return { filteredUsers };
}

export function useUsersSearched(usersFiltered: UserNormalized[], search: string) {
  const searchedUsers = useMemo(() => {
    if (!search) return usersFiltered;
    return usersFiltered?.filter((user) => {
      const searchLower = search.toLowerCase();
      return (
        user.normalizedNomPrenom.includes(searchLower) ||
        user.normalizedEmail.includes(searchLower) ||
        user.normalizedOrganismeNom.toLowerCase().includes(searchLower)
      );
    });
  }, [search, usersFiltered]);

  return { searchedUsers };
}
