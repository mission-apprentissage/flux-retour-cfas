"use client";

import DoublonsClient from "@/app/_components/effectifs/doublons/DoublonsClient";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { useOrganisme } from "@/hooks/organismes";

export default function OrganismeDoublonsPageClient({ organismeId }: { organismeId: string }) {
  const { organisme } = useOrganisme(organismeId);

  if (!organisme) {
    return <TableSkeleton />;
  }

  return <DoublonsClient organismeId={organisme._id} isMine={false} />;
}
