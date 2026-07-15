import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { _get, _put } from "@/common/httpClient";

import { BREVO_CONTACTS_QUERY_CONFIG, brevoContactsQueryKeys } from "./useBrevoContactLists";

export type BrevoSyncSettings = {
  dailyFullSyncEnabled: boolean;
  instantSyncEnabled: boolean;
  eventsEnabled: boolean;
};

export type BrevoSyncSettingField = "dailyFullSyncEnabled" | "instantSyncEnabled" | "eventsEnabled";

const syncSettingsQueryKey = [...brevoContactsQueryKeys.all, "sync-settings"] as const;

export function useBrevoSyncSettings() {
  return useQuery<BrevoSyncSettings>(
    syncSettingsQueryKey,
    () => _get<BrevoSyncSettings>("/api/v1/admin/brevo-contacts/sync-settings"),
    BREVO_CONTACTS_QUERY_CONFIG
  );
}

export function useSetBrevoSyncSetting() {
  const queryClient = useQueryClient();

  return useMutation<BrevoSyncSettings, Error, { field: BrevoSyncSettingField; enabled: boolean }>({
    mutationFn: ({ field, enabled }) =>
      _put("/api/v1/admin/brevo-contacts/sync-settings", { field, enabled }) as Promise<BrevoSyncSettings>,
    onSuccess: (data) => {
      queryClient.setQueryData(syncSettingsQueryKey, data);
    },
  });
}
