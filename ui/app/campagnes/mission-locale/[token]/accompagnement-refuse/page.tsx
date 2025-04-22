"use client";

import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";

import { AuthError, _get, _post } from "@/common/httpClient";

import { MissionLocaleQuestion } from "../../_components/question";

export default function Page() {
  const router = useRouter();
  const { token } = useParams() as { token: string };

  const { error, isLoading, isError } = useQuery(
    ["ml-effectif", token],
    () => _get(`/api/v1/campagne/mission-locale/${token}`),
    {
      enabled: !!token,
      keepPreviousData: true,
      retry: false,
      onError(err) {
        if (err instanceof AuthError) {
          router.push("/campagnes/mission-locale/lien-invalide");
        }
      },
    }
  );

  if (isLoading || (isError && error instanceof AuthError)) {
    return (
      <Stack justifyContent="center" alignItems="center" sx={{ height: "100vh" }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (isError && !(error instanceof AuthError)) {
    return <Typography color="error">Une erreur est survenue.</Typography>;
  }

  return (
    <Stack spacing={3}>
      <Stack justifyContent="end" alignItems="center">
        <Box
          component="img"
          src="/images/support_solid.svg"
          alt="Accompagner les apprentis"
          sx={{
            height: "180px",
            userSelect: "none",
            marginBottom: "16px",
            marginLeft: "auto",
          }}
        />
      </Stack>
      <Typography variant="h2" sx={{ color: "var(--text-title-blue-france)" }}>
        Nous avons bien pris en compte votre choix
      </Typography>
      <Typography>
        Nous ne manquerons pas de tenir compte de votre retour. N’hésitez pas à nous recontacter en cas de besoin.
      </Typography>
      <MissionLocaleQuestion />
    </Stack>
  );
}
