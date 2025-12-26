import { useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

interface FranceTravailQueryParams {
  search?: string;
  sort?: string;
  order?: string;
  page?: string;
  limit?: string;
  departements?: string;
}

export function useFranceTravailQueryParams() {
  const searchParams = useSearchParams();

  const params = useMemo<FranceTravailQueryParams>(
    () => ({
      search: searchParams?.get("search") || undefined,
      sort: searchParams?.get("sort") || undefined,
      order: searchParams?.get("order") || undefined,
      page: searchParams?.get("page") || undefined,
      limit: searchParams?.get("limit") || undefined,
      departements: searchParams?.get("departements") || undefined,
    }),
    [searchParams]
  );

  const buildQueryString = useCallback(
    (includePageLimit = false) => {
      const query = new URLSearchParams();
      if (params.search) query.set("search", params.search);
      if (params.sort) query.set("sort", params.sort);
      if (params.order) query.set("order", params.order);
      if (params.departements) query.set("departements", params.departements);
      if (includePageLimit) {
        if (params.page) query.set("page", params.page);
        if (params.limit) query.set("limit", params.limit);
      }
      return query.toString();
    },
    [params]
  );

  return { params, buildQueryString };
}
