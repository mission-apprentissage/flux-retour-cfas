"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import { MLHeader } from "@/app/_components/mission-locale/MLHeader";
import { EffectifsListView } from "@/app/_components/ruptures/mission-locale/EffectifsListView";
import { WhatsAppCallbackBanner } from "@/app/_components/ruptures/mission-locale/WhatsAppCallbackBanner";
import { countWhatsappCallbackRequests } from "@/app/_components/ruptures/shared/utils";
import { PageWithSidebarSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
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

  const whatsappCallbackCount = data?.injoignable ? countWhatsappCallbackRequests(data.injoignable) : 0;

  return (
    <div className="fr-container">
      <WhatsAppCallbackBanner count={whatsappCallbackCount} />
      <MLHeader />
      <SuspenseWrapper fallback={<PageWithSidebarSkeleton />}>
        {data && (
          <EffectifsListView
            data={data}
            initialStatut={statutParam}
            initialRuptureDate={dateRupture}
            whatsappCallbackCount={whatsappCallbackCount}
          />
        )}
      </SuspenseWrapper>
    </div>
  );
}
