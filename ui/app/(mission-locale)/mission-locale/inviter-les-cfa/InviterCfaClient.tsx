"use client";

import { CFA_INVITATION_STATUT, ICfaToInvite } from "shared/models/routes/mission-locale/missionLocale.api";

import { useCfaInvitations } from "@/app/_components/ruptures/mission-locale/invitations/hooks";
import { PageWithSidebarSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";

import { CfaInvitationList } from "./_components/CfaInvitationList";
import { InviterCfaHeader } from "./_components/InviterCfaHeader";

export default function InviterCfaClient() {
  const { data } = useCfaInvitations();

  const handleInvite = (_cfa: ICfaToInvite) => {
    // Lot 4 : ouverture de la modale d'invitation + envoi.
  };

  const invitations = data ?? [];
  const showEngagementCallout = invitations.some(
    (c) => c.statut === CFA_INVITATION_STATUT.INVITATION_ENVOYEE || c.statut === CFA_INVITATION_STATUT.CFA_ACTIF
  );

  return (
    <div>
      <InviterCfaHeader />
      <div className="fr-container">
        <SuspenseWrapper fallback={<PageWithSidebarSkeleton />}>
          {data && (
            <CfaInvitationList
              invitations={invitations}
              showEngagementCallout={showEngagementCallout}
              onInvite={handleInvite}
            />
          )}
        </SuspenseWrapper>
      </div>
    </div>
  );
}
