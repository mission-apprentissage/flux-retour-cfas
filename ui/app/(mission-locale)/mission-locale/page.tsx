"use client";

import { useQuery } from "@tanstack/react-query";

import { PageWithSidebarSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import MissionLocaleDisplay from "@/app/mission-locale/_components/MissionLocaleDisplay";
import { _get } from "@/common/httpClient";

import { MonthsData } from "./_components/types";

export default function Page() {
  const { data } = useQuery<MonthsData>(
    ["effectifs-per-month-user"],
    () => _get(`/api/v1/organisation/mission-locale/effectifs-per-month`),
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
