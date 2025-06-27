"use client";

import { Grid2, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";

import ARMLIndicateurGlobal from "@/app/_components/arml/ARMLIndicateurGlobal";
import CustomBreadcrumb from "@/app/_components/Breadcrumb";
import { PageWithSidebarSkeleton } from "@/app/_components/suspense/LoadingSkeletons";
import { SuspenseWrapper } from "@/app/_components/suspense/SuspenseWrapper";
import { _get } from "@/common/httpClient";

export default function AMLRMissionLocaleDetailsPage({ params }: { params: { mlId: string } }) {
  const { data: ml, isLoading } = useQuery<any>(["ml", params.mlId], async () => {
    const data = await _get(`/api/v1/organisation/arml/mls/${params.mlId}`);
    return data;
  });

  return (
    <div className="fr-container">
      <SuspenseWrapper fallback={<PageWithSidebarSkeleton />}>
        {isLoading ? (
          <p>Chargement…</p>
        ) : (
          <>
            <CustomBreadcrumb path={`/arml/missions-locales/[mlId]`} name={ml.nom} />
            <Typography
              variant="h3"
              sx={{
                mt: 3,
                mb: 6,
                color: "var(--text-title-blue-france)",
                textAlign: "left",
              }}
            >
              Mission Locale {ml.nom}
            </Typography>
            <Grid2 container spacing={2}>
              <Grid2 container size={6} mb={6}>
                <Grid2 container size={12}>
                  <Grid2 size={3}>
                    <Typography sx={{ textAlign: "left", fontWeight: "bold" }}>Siret</Typography>
                  </Grid2>
                  <Grid2 size={6}>
                    <Typography sx={{ textAlign: "left" }}>{ml.siret ?? "--"}</Typography>
                  </Grid2>
                </Grid2>
                <Grid2 container size={12}>
                  <Grid2 size={3}>
                    <Typography sx={{ textAlign: "left", fontWeight: "bold" }}>Adresse</Typography>
                  </Grid2>
                  <Grid2 size={6}>
                    <Typography sx={{ textAlign: "left" }}>
                      {ml.adresse ? `${ml.adresse.commune}, ${ml.adresse.code_postal}` : "--"}
                    </Typography>
                  </Grid2>
                </Grid2>
                <Grid2 container size={12}>
                  <Grid2 size={3}>
                    <Typography sx={{ textAlign: "left", fontWeight: "bold" }}>Courriel</Typography>
                  </Grid2>
                  <Grid2 size={6}>
                    <Typography sx={{ textAlign: "left" }}>{ml.email ?? "--"}</Typography>
                  </Grid2>
                </Grid2>
                <Grid2 container size={12}>
                  <Grid2 size={3}>
                    <Typography sx={{ textAlign: "left", fontWeight: "bold" }}>Site internet</Typography>
                  </Grid2>
                  <Grid2 size={6}>
                    <Typography sx={{ textAlign: "left" }}>
                      {ml.site_web ? (
                        <a href={ml.site_web} target="_blank" rel="noopener noreferrer">
                          {ml.site_web}
                        </a>
                      ) : (
                        "--"
                      )}
                    </Typography>
                  </Grid2>
                </Grid2>
                <Grid2 container size={12}>
                  <Grid2 size={3}>
                    <Typography sx={{ textAlign: "left", fontWeight: "bold" }}>Téléphone</Typography>
                  </Grid2>
                  <Grid2 size={6}>
                    <Typography sx={{ textAlign: "left" }}>{ml.telephone ?? "--"}</Typography>
                  </Grid2>
                </Grid2>
              </Grid2>
              <Grid2 container size={12}>
                <ARMLIndicateurGlobal armls={[ml]} />
              </Grid2>
            </Grid2>
          </>
        )}
      </SuspenseWrapper>
    </div>
  );
}
