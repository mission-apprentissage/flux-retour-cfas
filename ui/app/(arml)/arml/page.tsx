"use client";

import { Grid2, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { IOrganisationARML } from "shared";

import ARMLIndicateurGlobal from "@/app/_components/arml/ARMLIndicateurGlobal";
import { PageWithSidebarSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { _get } from "@/common/httpClient";

export default function Page() {
  // TODO: Add type instead of any
  const { data: armlData, isLoading } = useQuery<{ arml: IOrganisationARML; mlList: Array<any> }>(
    ["arml"],
    async () => {
      const data = await _get("/api/v1/organisation/arml/mls");
      return data;
    }
  );

  return (
    <div className="fr-container">
      <SuspenseWrapper fallback={<PageWithSidebarSkeleton />}>
        {isLoading || !armlData ? (
          <p>Chargement…</p>
        ) : (
          <Grid2 container spacing={2}>
            <Grid2 size={12}>
              <Typography
                variant="h3"
                sx={{
                  mb: 2,
                  textAlign: "left",
                  color: "var(--text-title-blue-france)",
                }}
              >
                ARML {armlData.arml.nom}
              </Typography>
            </Grid2>
            <Grid2 size={12}>
              <Typography
                variant="h4"
                sx={{
                  mb: 2,
                  textAlign: "left",
                  color: "var(--text-title-blue-france)",
                }}
              >
                Indicateurs Globaux
              </Typography>
            </Grid2>
            <ARMLIndicateurGlobal armls={armlData.mlList} />
          </Grid2>
        )}
      </SuspenseWrapper>
    </div>
  );
}
