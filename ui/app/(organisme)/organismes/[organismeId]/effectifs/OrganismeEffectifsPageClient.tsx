"use client";

import { EffectifsListeClient } from "@/app/_components/effectifs/liste/EffectifsListeClient";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { useOrganisme } from "@/hooks/organismes";

export default function OrganismeEffectifsPageClient({ organismeId }: { organismeId: string }) {
  const { organisme } = useOrganisme(organismeId);

  if (!organisme) {
    return <TableSkeleton />;
  }

  return <EffectifsListeClient organisme={organisme} modePublique />;
}
