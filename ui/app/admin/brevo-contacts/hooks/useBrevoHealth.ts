import { useQuery } from "@tanstack/react-query";

import { _get } from "@/common/httpClient";

import { brevoContactsQueryKeys } from "./useBrevoContactLists";

export type BrevoHealthCheck = {
  configured: boolean;
  ok: boolean;
  label: string;
  detail: string;
};

export type BrevoHealthReport = {
  apiKey: BrevoHealthCheck;
  tbaContactsList: BrevoHealthCheck;
};

// Le health-check fait 2 appels HTTP à Brevo (account + liste), on évite de le
// refetch trop souvent : 30s suffisent pour détecter une config cassée après
// déploiement.
const BREVO_HEALTH_QUERY_CONFIG = {
  staleTime: 30 * 1000,
  refetchOnWindowFocus: false,
} as const;

export function useBrevoHealth() {
  return useQuery<BrevoHealthReport>(
    [...brevoContactsQueryKeys.all, "health"] as const,
    () => _get<BrevoHealthReport>("/api/v1/admin/brevo-contacts/health"),
    BREVO_HEALTH_QUERY_CONFIG
  );
}
