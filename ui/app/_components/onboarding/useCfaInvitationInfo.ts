"use client";

import { useSearchParams } from "next/navigation";

import type { CfaOnboardingInfo } from "./cfa-invitation.types";
import { type OnboardingResourceState, useOnboardingInfo } from "./useOnboardingInfo";

export function useCfaInvitationInfo(): OnboardingResourceState<CfaOnboardingInfo> {
  const searchParams = useSearchParams();
  const invitationToken = searchParams?.get("invitationToken") ?? null;
  const url = invitationToken ? `/api/v1/onboarding/cfa-info?token=${encodeURIComponent(invitationToken)}` : null;
  return useOnboardingInfo<CfaOnboardingInfo>(url);
}
