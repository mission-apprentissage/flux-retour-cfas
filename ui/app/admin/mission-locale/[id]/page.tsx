"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

import { PageWithSidebarSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import MissionLocaleDisplay from "@/app/mission-locale/_components/MissionLocaleDisplay";
import { MonthsData } from "@/app/mission-locale/_components/types";
import { _get } from "@/common/httpClient";

export default function Page() {
  const params = useParams();
  const id = params?.id as string | undefined;

  const { data } = useQuery<MonthsData>(
    ["effectifs-per-month-user", id],
    () => _get(`/api/v1/admin/mission-locale/${id}/effectifs-per-month`),
    {
      suspense: true,
      useErrorBoundary: true,
    }
  );

  return (
    <SuspenseWrapper fallback={<PageWithSidebarSkeleton />}>
      {data && <MissionLocaleDisplay data={data} />}
    </SuspenseWrapper>
  );
}
