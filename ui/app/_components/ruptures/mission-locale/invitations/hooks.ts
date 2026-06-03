"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ICfaToInvite, IInviteCfaMissionLocaleApi } from "shared/models/routes/mission-locale/missionLocale.api";

import { _get, _post } from "@/common/httpClient";

export const cfaInvitationQueryKeys = {
  all: ["cfa-invitations"] as const,
};

export function useCfaInvitations() {
  return useQuery<ICfaToInvite[]>(
    cfaInvitationQueryKeys.all,
    () => _get(`/api/v1/organisation/mission-locale/cfa-invitations`),
    {
      suspense: true,
      useErrorBoundary: true,
    }
  );
}

export function useInviteCfa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: IInviteCfaMissionLocaleApi) =>
      _post(`/api/v1/organisation/mission-locale/cfa-invitations`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cfaInvitationQueryKeys.all });
    },
  });
}
