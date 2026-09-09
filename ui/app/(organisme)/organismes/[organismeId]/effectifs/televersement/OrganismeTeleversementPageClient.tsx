"use client";

import TeleversementClient from "@/app/_components/effectifs/televersement/TeleversementClient";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { useOrganisme } from "@/hooks/organismes";

export default function OrganismeTeleversementPageClient({ organismeId }: { organismeId: string }) {
  const { organisme } = useOrganisme(organismeId);

  if (!organisme) {
    return <TableSkeleton />;
  }

  return <TeleversementClient organismeId={organisme._id} isMine={false} />;
}
