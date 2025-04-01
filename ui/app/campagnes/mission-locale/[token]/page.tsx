"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { Box, Stack, Typography } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function Page() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [formData, setFormData] = useState<{ isInterested: boolean | null }>({
    isInterested: null,
  });

  const handleValider = () => {
    router.push(`/campagnes/mission-locale/${token}/validation`);
  };

  return (
    <>
      <Box
        component="img"
        src="/images/landing-missions-jeunes.svg"
        alt="Accompagner les apprentis"
        sx={{
          maxWidth: "350px",
          height: "auto",
          userSelect: "none",
          marginBottom: "16px",
        }}
      />
      <Typography variant="h2" sx={{ color: "var(--text-title-blue-france)" }}>
        Pour trouverez une entreprise, laissez-vous guider !
      </Typography>

      <Typography>
        Etre accompagné par la Mission Locale de Marseille, c’est bénéficier d’un accompagnement personnalisé, de
        proximité et profiter d’un réseau de partenaires !
      </Typography>

      <Stack p={2} spacing={2} sx={{ background: "var(--background-alt-blue-france)" }}>
        <RadioButtons
          legend="Intéressé(e) ?"
          orientation="vertical"
          options={[
            {
              label: "Oui, je suis intéressé(e) !",
              nativeInputProps: {
                value: "oui",
                checked: formData.isInterested === true,
                onChange: () =>
                  setFormData((prev) => ({
                    ...prev,
                    isInterested: true,
                  })),
              },
            },
            {
              label: "Non merci",
              nativeInputProps: {
                value: "non",
                checked: formData.isInterested === false,
                onChange: () =>
                  setFormData((prev) => ({
                    ...prev,
                    isInterested: false,
                  })),
              },
            },
          ]}
        />

        <Button onClick={handleValider}>Valider ma réponse</Button>
      </Stack>
    </>
  );
}
