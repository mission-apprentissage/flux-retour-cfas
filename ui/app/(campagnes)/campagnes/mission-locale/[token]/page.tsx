"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";

import { AuthError, _get } from "@/common/httpClient";
import { publicConfig } from "@/config.public";

import { MissionLocaleFaq } from "../_components/faq";
import { MissionLocaleQuestion } from "../_components/question";

export default function Page() {
  const router = useRouter();
  const { token } = useParams() as { token: string };
  const [formData, setFormData] = useState<{ isInterested: boolean | null }>({ isInterested: null });

  const { data, error, isLoading, isError } = useQuery(
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

  const handleValider = () => {
    if (formData.isInterested === null) return;
    window.location.href = `${publicConfig.baseUrl}/api/v1/campagne/mission-locale/${token}/confirmation/${formData.isInterested ? "true" : "false"}`;
  };

  return (
    <Stack spacing={3} sx={{ width: "100%" }}>
      <Stack justifyContent="end" alignItems="center">
        <Box
          component="img"
          src="/images/landing-missions-jeunes.svg"
          alt="Accompagner les apprentis"
          sx={{
            maxWidth: "auto",
            height: "180px",
            userSelect: "none",
            marginBottom: "16px",
            marginLeft: "auto",
          }}
        />
      </Stack>

      <Typography variant="h2" sx={{ color: "var(--text-title-blue-france)" }}>
        Pour trouver une entreprise, laissez-vous guider&nbsp;!
      </Typography>

      <Typography>
        Être accompagné par la Mission Locale {data?.missionLocale?.nom}, c’est bénéficier d’un accompagnement
        personnalisé, de proximité et profiter d’un réseau de partenaires !
      </Typography>

      <Stack p={{ xs: 2, md: 4 }} spacing={2} sx={{ background: "var(--background-alt-blue-france)" }}>
        <RadioButtons
          legend="Intéressé(e) ?"
          orientation="vertical"
          options={[
            {
              label: "Oui, je suis intéressé(e) !",
              nativeInputProps: {
                value: "oui",
                checked: formData.isInterested === true,
                onChange: () => setFormData({ isInterested: true }),
              },
            },
            {
              label: "Non merci",
              nativeInputProps: {
                value: "non",
                checked: formData.isInterested === false,
                onChange: () => setFormData({ isInterested: false }),
              },
            },
          ]}
        />
        <Button onClick={handleValider} disabled={formData.isInterested === null}>
          Valider ma réponse
        </Button>
      </Stack>

      <MissionLocaleQuestion />
      {data && data.missionLocale && (
        <MissionLocaleFaq missionLocalNom={data.missionLocale.nom} organismeNom={data.organismeNom} />
      )}
    </Stack>
  );
}
