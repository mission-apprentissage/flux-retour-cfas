"use client";

import { useState } from "react";
import { CFA_INVITATION_STATUT, ICfaToInvite } from "shared/models/routes/mission-locale/missionLocale.api";

import { useCfaInvitations, useInviteCfa } from "@/app/_components/ruptures/mission-locale/invitations/hooks";
import { PageWithSidebarSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";

import { CfaInvitationList } from "./_components/CfaInvitationList";
import { InviteCfaModal, inviteCfaModal } from "./_components/InviteCfaModal";
import { InviterCfaHeader } from "./_components/InviterCfaHeader";

export default function InviterCfaClient() {
  const { data } = useCfaInvitations();
  const inviteCfa = useInviteCfa();
  const [selectedCfa, setSelectedCfa] = useState<ICfaToInvite | null>(null);

  const handleInvite = (cfa: ICfaToInvite) => {
    setSelectedCfa(cfa);
    inviteCfaModal.open();
  };

  const handleConfirm = async (note: string) => {
    if (!selectedCfa) return;
    await inviteCfa.mutateAsync({ organisme_id: selectedCfa.organisme_id, note: note || undefined });
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
      <InviteCfaModal cfa={selectedCfa} onConfirm={handleConfirm} />
    </div>
  );
}
