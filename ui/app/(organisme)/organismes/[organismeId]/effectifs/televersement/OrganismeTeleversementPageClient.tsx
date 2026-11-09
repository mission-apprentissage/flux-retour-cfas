"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";

import TeleversementClient from "@/app/_components/effectifs/televersement/TeleversementClient";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { useOrganisme } from "@/hooks/organismes";

export default function OrganismeTeleversementPageClient({ organismeId }: { organismeId: string }) {
  const { organisme, error } = useOrganisme(organismeId);

  if (error) {
    return (
      <Alert
        severity="error"
        title="Impossible de charger cet organisme. Rechargez la page ou revenez à la liste des organismes."
        description=""
        small
      />
    );
  }

  if (!organisme) {
    return <TableSkeleton />;
  }

  return <TeleversementClient organismeId={organisme._id} isMine={false} />;
}
