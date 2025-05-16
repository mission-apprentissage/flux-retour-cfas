"use client";

import { Stack, Box } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { MissionLocaleDisplay } from "@/app/_components/mission-locale/MissionLocaleDisplay";
import { MonthsData } from "@/app/_components/mission-locale/types";
import { PageWithSidebarSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
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

  const { data: missionLocale } = useQuery(["mission-locale", id], () => _get(`/api/v1/admin/mission-locale/${id}`), {
    suspense: true,
    useErrorBoundary: true,
  });

  console.log("CONSOLE LOG ~ const{data:missionLocale}=useQuery ~ missionLocale:", missionLocale);

  return (
    <div className="fr-container">
      <Stack spacing={3}>
        <DsfrLink href={`/admin/mission-locale`} arrow="left">
          Retour à la liste des missions locales
        </DsfrLink>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="end">
          <Box flex="1">
            <h1 className="fr-h1 fr-text--blue-france fr-mb-1w">Liste des jeunes en ruptures de contrat</h1>
          </Box>
        </Stack>
      </Stack>
      <Box flex="1">
        <h6 className="">Mission locale {missionLocale.nom}</h6>
      </Box>
      <Box component="hr" className="fr-hr" />
      <SuspenseWrapper fallback={<PageWithSidebarSkeleton />}>
        {data && <MissionLocaleDisplay data={data} />}
      </SuspenseWrapper>
    </div>
  );
}
