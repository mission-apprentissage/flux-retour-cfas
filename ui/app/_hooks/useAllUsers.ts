import { useQuery } from "@tanstack/react-query";
import { SortingState } from "@tanstack/react-table";
import { useMemo } from "react";

import { _get } from "@/common/httpClient";
import { toUserNormalized } from "@/modules/admin/users/models/users";
import { UsersFilters } from "@/modules/admin/users/models/users-filters";

export function useAllUsers(
  page = 1,
  limit = 20,
  sorting: SortingState = [],
  search = "",
  filters: Partial<UsersFilters> = {}
) {
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      limit,
      sort: sorting.length > 0 ? `${sorting[0].id}:${sorting[0].desc ? "-1" : "1"}` : "created_at:-1",
    };

    if (search.trim()) params.q = search.trim();

    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        params[key] = value.join(",");
      }
    });

    return params;
  }, [page, limit, sorting, search, filters]);

  const {
    data: usersPaginated,
    refetch: refetchUsers,
    isLoading,
  } = useQuery({
    queryKey: ["admin/users", queryParams],
    queryFn: () => _get("/api/v1/admin/users/", { params: queryParams }),
    keepPreviousData: true,
  });

  return useMemo(() => {
    const users = usersPaginated?.data?.map(toUserNormalized) ?? [];
    const paginationData = usersPaginated?.pagination ?? usersPaginated ?? {};

    return {
      users,
      pagination: {
        total: paginationData.total ?? 0,
        page: paginationData.page ?? 1,
        limit: paginationData.limit ?? 20,
        lastPage: paginationData.lastPage ?? 1,
      },
      refetchUsers,
      isLoading,
    };
  }, [usersPaginated, refetchUsers, isLoading]);
}
