import { useQuery } from "@tanstack/react-query";

import { _get } from "@/common/httpClient";

const cfaUnreadNotificationsKey = (organismeId: string) => ["cfa", "unread-notifications-count", organismeId] as const;

export function useCfaUnreadNotificationsCount(organismeId: string | undefined) {
  return useQuery<{ count: number }>({
    queryKey: cfaUnreadNotificationsKey(organismeId!),
    queryFn: () => _get(`/api/v1/organismes/${organismeId}/cfa/unread-notifications-count`),
    enabled: !!organismeId,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
}
