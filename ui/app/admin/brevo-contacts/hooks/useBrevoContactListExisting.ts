import { useQuery } from "@tanstack/react-query";

import { _get } from "@/common/httpClient";

import { BREVO_CONTACTS_QUERY_CONFIG, brevoContactsQueryKeys } from "./useBrevoContactLists";

export type ExistingBrevoContactList = { listId: number; listName: string; updated_at: string } | null;

export function useBrevoContactListExisting(slug: string) {
  return useQuery<ExistingBrevoContactList>(
    brevoContactsQueryKeys.existing(slug),
    () => _get<ExistingBrevoContactList>(`/api/v1/admin/brevo-contacts/${slug}/list`),
    BREVO_CONTACTS_QUERY_CONFIG
  );
}
