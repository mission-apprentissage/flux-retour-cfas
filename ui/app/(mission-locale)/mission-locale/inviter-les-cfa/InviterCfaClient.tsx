"use client";

import { useState } from "react";
import { CFA_INVITATION_STATUT, ICfaToInvite } from "shared/models/routes/mission-locale/missionLocale.api";

import { useMUIToaster } from "@/app/_components/MUIToaster";
import { useCfaInvitations, useInviteCfa } from "@/app/_components/ruptures/mission-locale/invitations/hooks";
import { PageWithSidebarSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";

import { CfaInvitationList } from "./_components/CfaInvitationList";
import { InviteCfaModal, inviteCfaModal } from "./_components/InviteCfaModal";
import { InviterCfaHeader } from "./_components/InviterCfaHeader";

function InviterCfaContenu({ onInvite }: { onInvite: (cfa: ICfaToInvite) => void }) {
  const { data } = useCfaInvitations();

  const invitations = data ?? [];
  const showEngagementCallout = invitations.some((c) => c.statut === CFA_INVITATION_STATUT.INVITATION_ENVOYEE);

  return (
    <CfaInvitationList invitations={invitations} showEngagementCallout={showEngagementCallout} onInvite={onInvite} />
  );
}

export default function InviterCfaClient() {
  const inviteCfa = useInviteCfa();
  const { toastSuccess } = useMUIToaster();
  const [selectedCfa, setSelectedCfa] = useState<ICfaToInvite | null>(null);

  const handleInvite = (cfa: ICfaToInvite) => {
    setSelectedCfa(cfa);
    inviteCfaModal.open();
  };

  const handleConfirm = async (note: string) => {
    if (!selectedCfa) return;
    await inviteCfa.mutateAsync({ organisme_id: selectedCfa.organisme_id, note: note || undefined });
    toastSuccess(`Invitation envoyée à ${selectedCfa.nom ?? "ce CFA"}.`);
  };

  return (
    <div>
      <InviterCfaHeader />
      <div className="fr-container">
        <SuspenseWrapper fallback={<PageWithSidebarSkeleton />}>
          <InviterCfaContenu onInvite={handleInvite} />
        </SuspenseWrapper>
      </div>
      <InviteCfaModal cfa={selectedCfa} onConfirm={handleConfirm} />
    </div>
  );
}
