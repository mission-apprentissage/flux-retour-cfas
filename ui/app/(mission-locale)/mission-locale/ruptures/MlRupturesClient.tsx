"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import { MLHeader } from "@/app/_components/mission-locale/MLHeader";
import { MlRupturesListView } from "@/app/_components/ruptures/mission-locale/MlRupturesListView";
import { PageWithSidebarSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { PostalCodeOption } from "@/app/_utils/ruptures.utils";
import { _get } from "@/common/httpClient";
import { MonthsData } from "@/common/types/ruptures";

/**
 * Les requêtes vivent sous le Suspense : au rendu serveur, l'appel API part sans le cookie de
 * session et échoue en 401. Isolées ici, elles laissent streamer l'écran d'attente et sont
 * rejouées côté client avec la session ; au niveau du composant parent, l'erreur ferait
 * échouer toute la page.
 */
function MlRupturesContenu({
  initialStatut,
  initialRuptureDate,
}: {
  initialStatut: string | null;
  initialRuptureDate: string | null;
}) {
  const { data } = useSuspenseQuery<MonthsData>({
    queryKey: ["effectifs-per-month-user"],
    queryFn: () => _get(`/api/v1/organisation/mission-locale/effectifs-per-month`),
  });

  const { data: postalCodeOptions } = useSuspenseQuery<PostalCodeOption[]>({
    queryKey: ["mission-locale-villes"],
    queryFn: () => _get(`/api/v1/organisation/mission-locale/villes`),
  });

  if (!data) return null;

  return (
    <MlRupturesListView
      data={data}
      postalCodeOptions={postalCodeOptions ?? []}
      initialStatut={initialStatut}
      initialRuptureDate={initialRuptureDate}
    />
  );
}

export default function MlRupturesClient() {
  const searchParams = useSearchParams();
  const statutParam = searchParams?.get("statut") || null;
  const dateRupture = searchParams?.get("rupture") || null;

  return (
    <>
      <MLHeader />
      <SuspenseWrapper fallback={<PageWithSidebarSkeleton />}>
        <MlRupturesContenu initialStatut={statutParam} initialRuptureDate={dateRupture} />
      </SuspenseWrapper>
    </>
  );
}
