import { useMutation, useQueryClient } from "@tanstack/react-query";

import { _post } from "@/common/httpClient";

import { brevoContactsQueryKeys } from "./useBrevoContactLists";

export type SampleContact = { email: string; attributes: Record<string, unknown> };

export type AttributesReport = {
  created: string[];
  skipped: string[];
  conflicts: Array<{ name: string; existingType: string; expectedType: string }>;
  casingMismatches: Array<{ codeName: string; brevoName: string }>;
};

export type SyncResult = {
  dryRun: boolean;
  listId?: number;
  listName: string;
  count: number;
  sample?: SampleContact[];
  batches?: number;
  failedBatches?: number;
  attributes?: AttributesReport;
};

export type SyncVariables = { dryRun: boolean };

export function useBrevoContactListSync(slug: string) {
  const queryClient = useQueryClient();

  return useMutation<SyncResult, Error, SyncVariables>({
    mutationFn: ({ dryRun }) =>
      _post<SyncVariables, SyncResult>(`/api/v1/admin/brevo-contacts/${slug}/sync`, { dryRun }),
    onSuccess: (_data, variables) => {
      if (!variables.dryRun) {
        queryClient.invalidateQueries({ queryKey: brevoContactsQueryKeys.existing(slug) });
      }
    },
  });
}
