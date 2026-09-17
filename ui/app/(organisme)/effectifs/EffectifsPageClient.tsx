"use client";

import { EffectifsListeClient } from "@/app/_components/effectifs/liste/EffectifsListeClient";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { useOrganisationOrganisme } from "@/hooks/organismes";

export default function EffectifsPageClient() {
  const { organisme } = useOrganisationOrganisme();

  if (!organisme) {
    return <TableSkeleton />;
  }

  return <EffectifsListeClient organisme={organisme} modePublique={false} />;
}
