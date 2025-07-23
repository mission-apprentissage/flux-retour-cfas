"use client";

import { Stack, Box } from "@mui/material";
import { useQuery } from "@tanstack/react-query";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { ModalAdminSyncBrevo } from "@/app/_components/mission-locale/modal/ModalAdminSyncBrevo";
import { EffectifListDisplay } from "@/app/_components/ruptures/EffectifListDisplay";
import { PageWithSidebarSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { _get } from "@/common/httpClient";
import { MonthsData } from "@/common/types/ruptures";

export default function MissionLocaleAdminEditClient({ id }: { id: string }) {
  const { data: missionLocaleData } = useQuery(
    ["mission-locale", id],
    () => _get(`/api/v1/admin/mission-locale/${id}`),
    {
      suspense: true,
      useErrorBoundary: true,
    }
  );

  const { data: effectifsData } = useQuery<MonthsData>(
    ["effectifs-per-month-user", id],
    () => _get(`/api/v1/admin/mission-locale/${id}/effectifs-per-month`),
    {
      suspense: true,
      useErrorBoundary: true,
    }
  );

  return (
    <SuspenseWrapper fallback={<PageWithSidebarSkeleton />}>
      <div className="fr-container">
        <Stack spacing={3}>
          <DsfrLink href="/admin/mission-locale" arrow="left">
            Retour à la liste des missions locales
          </DsfrLink>

          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="end">
            <Box flex="1">
              <h1 className="fr-h1 fr-text--blue-france fr-mb-1w">Liste des jeunes en ruptures de contrat</h1>
            </Box>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="flex-end" alignItems="center">
              <ModalAdminSyncBrevo id={id} />
            </Stack>
          </Stack>
        </Stack>

        {missionLocaleData && (
          <Box flex="1">
            <h6>Mission locale {missionLocaleData.nom}</h6>
          </Box>
        )}

        <Box component="hr" className="fr-hr" />

        {effectifsData && <EffectifListDisplay data={effectifsData} />}
      </div>
    </SuspenseWrapper>
  );
}
