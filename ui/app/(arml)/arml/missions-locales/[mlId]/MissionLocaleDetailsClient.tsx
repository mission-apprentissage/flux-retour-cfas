"use client";

import { useQuery } from "@tanstack/react-query";
import { use } from "react";
import { IOrganisationMissionLocale } from "shared";

import MissionLocaleDetailsContent from "@/app/_components/arml/MissionLocaleDetailsContent";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { _get } from "@/common/httpClient";

export default function MissionLocaleDetailsClient({ params }: { params: Promise<{ mlId: string }> }) {
  const { mlId } = use(params);
  const { data: ml } = useQuery<IOrganisationMissionLocale>(
    ["ml", mlId],
    async () => {
      const data = await _get(`/api/v1/organisation/arml/mls/${mlId}`);
      return data;
    },
    {
      suspense: true,
    }
  );

  if (!ml) return null;
  return (
    <SuspenseWrapper fallback={<TableSkeleton />}>
      <MissionLocaleDetailsContent ml={ml} />
    </SuspenseWrapper>
  );
}
