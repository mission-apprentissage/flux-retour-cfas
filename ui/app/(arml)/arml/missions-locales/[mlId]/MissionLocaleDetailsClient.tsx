"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { use } from "react";
import { IOrganisationMissionLocale } from "shared";

import MissionLocaleDetailsContent from "@/app/_components/arml/MissionLocaleDetailsContent";
import CustomBreadcrumb from "@/app/_components/Breadcrumb";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { _get } from "@/common/httpClient";

export default function MissionLocaleDetailsClient({ params }: { params: Promise<{ mlId: string }> }) {
  const { mlId } = use(params);
  const searchParams = useSearchParams();

  const rqth_only = searchParams?.get("rqth_only");
  const mineur_only = searchParams?.get("mineur_only");

  const { data: ml } = useQuery<IOrganisationMissionLocale>(
    ["ml", mlId, rqth_only, mineur_only],
    async () => {
      const data = await _get(`/api/v1/organisation/arml/mls/${mlId}`, { params: { rqth_only, mineur_only } });
      return data;
    },
    {
      suspense: true,
    }
  );

  if (!ml) return null;
  return (
    <SuspenseWrapper fallback={<TableSkeleton />}>
      <CustomBreadcrumb path={`/arml/missions-locales/[mlId]`} name={ml.nom} />
      <MissionLocaleDetailsContent ml={ml} />
    </SuspenseWrapper>
  );
}
