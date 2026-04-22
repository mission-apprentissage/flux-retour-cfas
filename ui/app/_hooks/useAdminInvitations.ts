import { useQuery } from "@tanstack/react-query";
import { SortingState } from "@tanstack/react-table";
import { useMemo } from "react";

import { _get } from "@/common/httpClient";

export interface AdminInvitation {
  _id: string;
  email: string;
  prenom?: string;
  nom?: string;
  role?: "admin" | "member";
  token: string;
  created_at: string;
  expires_at?: string;
  organisation?: {
    _id: string;
    type: string;
    nom?: string;
    siret?: string;
    uai?: string;
    organisme?: {
      nom?: string;
      raison_sociale?: string;
      enseigne?: string;
      siret?: string;
      uai?: string;
    };
  };
  author?: {
    email?: string;
    nom?: string;
    prenom?: string;
  };
}

interface UseAdminInvitationsParams {
  status: "pending" | "consumed";
  type?: string;
  role?: "admin" | "member";
  organisation_id?: string;
  search?: string;
  page?: number;
  limit?: number;
  sorting?: SortingState;
  enabled?: boolean;
}

export function useAdminInvitations({
  status,
  type,
  role,
  organisation_id,
  search,
  page = 1,
  limit = 20,
  sorting = [],
  enabled = true,
}: UseAdminInvitationsParams) {
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      status,
      page,
      limit,
      sort: sorting.length > 0 ? `${sorting[0].id}:${sorting[0].desc ? "-1" : "1"}` : "created_at:-1",
    };
    if (type) params.type = type;
    if (role) params.role = role;
    if (organisation_id) params.organisation_id = organisation_id;
    if (search && search.trim()) params.search = search.trim();
    return params;
  }, [status, type, role, organisation_id, search, page, limit, sorting]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin/invitations", queryParams],
    queryFn: () =>
      _get<{ data: AdminInvitation[]; pagination: { total: number; page: number; limit: number; lastPage: number } }>(
        "/api/v1/admin/invitations",
        { params: queryParams }
      ),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
    enabled,
  });

  return useMemo(
    () => ({
      invitations: data?.data ?? [],
      pagination: {
        total: data?.pagination?.total ?? 0,
        page: data?.pagination?.page ?? 1,
        limit: data?.pagination?.limit ?? 20,
        lastPage: data?.pagination?.lastPage ?? 1,
        globalTotal: data?.pagination?.total ?? 0,
      },
      isLoading,
      isFetching,
      refetch,
    }),
    [data, isLoading, isFetching, refetch]
  );
}
