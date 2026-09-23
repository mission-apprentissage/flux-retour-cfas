"use client";

import DoublonsClient from "@/app/_components/effectifs/doublons/DoublonsClient";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { useOrganisationOrganisme } from "@/hooks/organismes";

export default function DoublonsPageClient() {
  const { organisme } = useOrganisationOrganisme();

  if (!organisme) {
    return <TableSkeleton />;
  }

  return <DoublonsClient organismeId={organisme._id} isMine />;
}
