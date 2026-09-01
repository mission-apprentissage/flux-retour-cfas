"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import { MlListeHeader } from "@/app/_components/ruptures/mission-locale/liste/MlListeHeader";
import { MlRupturesListView } from "@/app/_components/ruptures/mission-locale/MlRupturesListView";
import { PageWithSidebarSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { PostalCodeOption } from "@/app/_utils/ruptures.utils";
import { _get } from "@/common/httpClient";
import { MonthsData } from "@/common/types/ruptures";

const LIEN_DECA =
  "https://efpconnect.emploi.gouv.fr/auth/realms/efp/protocol/cas/login?TARGET=https%3A%2F%2Fdeca.alternance.emploi.gouv.fr%3A443%2Fdeca-app%2F";

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
      <MlListeHeader
        titre="Tous les dossiers"
        intro={
          <>
            Retrouvez dans cette liste l&apos;ensemble des dossiers des jeunes identifiés en difficulté dans leur
            parcours d&apos;apprentissage. Cette liste contient l&apos;ensemble des jeunes identifiés en rupture sur le
            territoire via les ERP des CFA et la base DECA, mais aussi les jeunes pour lesquels les CFA utilisateurs du
            Tableau de bord ont sollicité une collaboration avec votre Mission Locale.
          </>
        }
        sources={
          <>
            Sources : Les ERP des CFA et{" "}
            <a href={LIEN_DECA} target="_blank" rel="noopener external">
              DECA
            </a>
          </>
        }
      />
      <SuspenseWrapper fallback={<PageWithSidebarSkeleton />}>
        <MlRupturesContenu initialStatut={statutParam} initialRuptureDate={dateRupture} />
      </SuspenseWrapper>
    </>
  );
}
