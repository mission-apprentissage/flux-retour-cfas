"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
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

  const { data } = useSuspenseQuery<MonthsData>({
    queryKey: ["effectifs-per-month-user"],
    queryFn: () => _get(`/api/v1/organisation/mission-locale/effectifs-per-month`),
  });

  const { data: postalCodeOptions } = useSuspenseQuery<PostalCodeOption[]>({
    queryKey: ["mission-locale-villes"],
    queryFn: () => _get(`/api/v1/organisation/mission-locale/villes`),
  });

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
