"use client";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ICfaToInvite, IInviteCfaMissionLocaleApi } from "shared/models/routes/mission-locale/missionLocale.api";

import { _get, _post } from "@/common/httpClient";

export const cfaInvitationQueryKeys = {
  all: ["cfa-invitations"] as const,
};

export function useCfaInvitations() {
  return useSuspenseQuery<ICfaToInvite[]>({
    queryKey: cfaInvitationQueryKeys.all,
    queryFn: () => _get(`/api/v1/organisation/mission-locale/cfa-invitations`),
  });
}

export function useInviteCfa() {
  const queryClient = useQueryClient();

  return useMutation<{ nb_destinataires: number; organisme_nom: string }, Error, IInviteCfaMissionLocaleApi>({
    mutationFn: (body) => _post(`/api/v1/organisation/mission-locale/cfa-invitations`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cfaInvitationQueryKeys.all });
    },
  });
}
