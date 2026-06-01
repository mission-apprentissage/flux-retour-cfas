"use client";

import { useSearchParams } from "next/navigation";

import type { ConnexionInvitationInfo } from "./connexion-invitation.types";
import { type OnboardingResourceState, useOnboardingInfo } from "./useOnboardingInfo";

export function useConnexionInvitationInfo(): OnboardingResourceState<ConnexionInvitationInfo> {
  const searchParams = useSearchParams();
  const invitationToken = searchParams?.get("invitationToken") ?? null;
  const url = invitationToken ? `/api/v1/onboarding/connexion-info?token=${encodeURIComponent(invitationToken)}` : null;
  return useOnboardingInfo<ConnexionInvitationInfo>(url);
}
