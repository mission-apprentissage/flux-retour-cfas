import { Box, Stack, Typography } from "@mui/material";

import { MissionLocaleQuestion } from "../_components/question";

export default function InvalidLinkPage() {
  return (
    <Stack spacing={3} sx={{ width: "100%" }}>
      <Stack justifyContent="end" alignItems="center">
        <Typography variant="h2" sx={{ color: "var(--text-title-blue-france)" }} mb={3}>
          Ce lien n&apos;est plus valide. Si vous avez déjà répondu à l&apos;enquête, un mail de confirmation vous a été
          envoyé.
        </Typography>
        <Box
          component="img"
          src="/images/support_solid.svg"
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

      <MissionLocaleQuestion />
    </Stack>
  );
}
