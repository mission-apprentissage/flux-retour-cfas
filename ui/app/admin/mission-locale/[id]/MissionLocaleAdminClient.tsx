"use client";

import { useQuery } from "@tanstack/react-query";
import { use } from "react";

import MissionLocaleDetailsContent from "@/app/_components/arml/MissionLocaleDetailsContent";
import CustomBreadcrumb from "@/app/_components/Breadcrumb";
import { TableSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { _get } from "@/common/httpClient";

export default function MissionLocaleDetailsClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: missionLocaleData } = useQuery(
    ["mission-locale", id],
    () => _get(`/api/v1/admin/mission-locale/${id}/stats`),
    {
      suspense: true,
      useErrorBoundary: true,
    }
  );

  if (!missionLocaleData) return null;
  return (
    <SuspenseWrapper fallback={<TableSkeleton />}>
      <CustomBreadcrumb path={`/admin/mission-locale/[mlId]`} name={missionLocaleData.nom} />
      <MissionLocaleDetailsContent ml={missionLocaleData} />
    </SuspenseWrapper>
  );
}
