import { useQuery } from "@tanstack/react-query";

import { _get } from "@/common/httpClient";

import type { EligibilityCheck } from "./EligibilityBadges";

export type CollabV2EligibilityResult = {
  eligible: boolean;
  alreadyActive: boolean;
  checks: {
    exists_with_siret_uai: EligibilityCheck;
    nature: EligibilityCheck;
    not_closed: EligibilityCheck;
    has_effectifs: EligibilityCheck;
    deca_visible: EligibilityCheck;
    has_compte_confirme: EligibilityCheck;
    not_already_active: EligibilityCheck;
  };
  organisme: {
    _id: string;
    siret: string;
    uai: string | null;
    nature?: string;
    is_allowed_collab?: boolean | null;
    collab_suspended_at?: string | null;
    collab_inactivity_email_sent_at?: string | null;
  } | null;
};

export const collabV2EligibilityQueryKey = (organismeId: string) => [
  "admin/organismes/collab-v2-eligibility",
  organismeId,
];

export function useCollabV2Eligibility(organismeId: string) {
  return useQuery<CollabV2EligibilityResult>({
    queryKey: collabV2EligibilityQueryKey(organismeId),
    queryFn: () => _get(`/api/v1/admin/organismes/${organismeId}/collab-v2-eligibility`),
    enabled: !!organismeId,
  });
}
