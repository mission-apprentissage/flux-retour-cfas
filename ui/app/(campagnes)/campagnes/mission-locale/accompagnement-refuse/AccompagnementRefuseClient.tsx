"use client";

import { Box, Stack, Typography } from "@mui/material";

import { MissionLocaleQuestion } from "../_components/question";

export default function AccompagnementRefuseClient() {
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
        Nous ne manquerons pas de tenir compte de votre retour. N&apos;hésitez pas à nous recontacter en cas de besoin.
      </Typography>
      <MissionLocaleQuestion />
    </Stack>
  );
}
