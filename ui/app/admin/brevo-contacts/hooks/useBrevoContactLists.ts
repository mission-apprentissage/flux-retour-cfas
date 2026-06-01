import { useQuery } from "@tanstack/react-query";

import { _get } from "@/common/httpClient";

export type ContactListSummary = { slug: string; label: string; description: string };

export const brevoContactsQueryKeys = {
  all: ["admin", "brevo-contacts"] as const,
  lists: () => [...brevoContactsQueryKeys.all, "lists"] as const,
  existing: (slug: string) => [...brevoContactsQueryKeys.all, slug, "existing"] as const,
};

export const BREVO_CONTACTS_QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export function useBrevoContactLists() {
  return useQuery<ContactListSummary[]>(
    brevoContactsQueryKeys.lists(),
    () => _get<ContactListSummary[]>("/api/v1/admin/brevo-contacts"),
    BREVO_CONTACTS_QUERY_CONFIG
  );
}
