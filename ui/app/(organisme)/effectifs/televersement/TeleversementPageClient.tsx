"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";

import TeleversementClient from "@/app/_components/effectifs/televersement/TeleversementClient";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { useOrganisationOrganisme } from "@/hooks/organismes";

export default function TeleversementPageClient() {
  const { organisme, isLoading } = useOrganisationOrganisme();

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (!organisme) {
    return (
      <Alert
        severity="error"
        title="Accès refusé"
        description="Vous ne disposez pas des droits nécessaires pour visualiser cette page."
      />
    );
  }

  return <TeleversementClient organismeId={organisme._id} isMine />;
}
