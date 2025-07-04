"use client";

import { useQuery } from "@tanstack/react-query";

import { MissionLocaleDisplay } from "@/app/_components/mission-locale/MissionLocaleDisplay";
import { MLHeader } from "@/app/_components/mission-locale/MLHeader";
import { MonthsData } from "@/app/_components/mission-locale/types";
import { PageWithSidebarSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { _get } from "@/common/httpClient";

export default function MissionLocaleClient() {
  const { data } = useQuery<MonthsData>(
    ["effectifs-per-month-user"],
    () => _get(`/api/v1/organisation/mission-locale/effectifs-per-month`),
    {
      suspense: true,
      useErrorBoundary: true,
    }
  );

  return (
    <div className="fr-container">
      <MLHeader />
      <SuspenseWrapper fallback={<PageWithSidebarSkeleton />}>
        {data && <MissionLocaleDisplay data={data} />}
      </SuspenseWrapper>
    </div>
  );
}
