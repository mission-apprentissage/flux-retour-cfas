"use client";

import { useQuery } from "@tanstack/react-query";
import { ICfaToInvite } from "shared/models/routes/mission-locale/missionLocale.api";

import { _get } from "@/common/httpClient";

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
