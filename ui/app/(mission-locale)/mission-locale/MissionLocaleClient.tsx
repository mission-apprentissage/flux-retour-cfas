"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import { MLHeader } from "@/app/_components/mission-locale/MLHeader";
import { EffectifsListView } from "@/app/_components/ruptures/mission-locale/EffectifsListView";
import { PageWithSidebarSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { PostalCodeOption } from "@/app/_utils/ruptures.utils";
import { _get } from "@/common/httpClient";
import { MonthsData } from "@/common/types/ruptures";

export default function MissionLocaleClient() {
  const searchParams = useSearchParams();
  const statutParam = searchParams?.get("statut") || null;
  const dateRupture = searchParams?.get("rupture") || null;

  const { data } = useQuery<MonthsData>(
    ["effectifs-per-month-user"],
    () => _get(`/api/v1/organisation/mission-locale/effectifs-per-month`),
    {
      suspense: true,
      useErrorBoundary: true,
    }
  );

  const { data: postalCodeOptions } = useQuery<PostalCodeOption[]>(
    ["mission-locale-villes"],
    () => _get(`/api/v1/organisation/mission-locale/villes`),
    {
      suspense: true,
      useErrorBoundary: true,
    }
  );

  return (
    <>
      <MLHeader />
      <SuspenseWrapper fallback={<PageWithSidebarSkeleton />}>
        {data && (
          <EffectifsListView
            data={data}
            postalCodeOptions={postalCodeOptions ?? []}
            initialStatut={statutParam}
            initialRuptureDate={dateRupture}
          />
        )}
      </SuspenseWrapper>
    </>
  );
}
