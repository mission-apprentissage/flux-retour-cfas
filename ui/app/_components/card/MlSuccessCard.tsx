import { Box, Typography, Link, Stack } from "@mui/material";
import React from "react";

import { SelectedSection } from "@/app/(mission-locale)/mission-locale/_components/types";

export const MlSuccessCard = ({
  handleSectionChange,
}: {
  handleSectionChange?: (section: SelectedSection) => void;
}) => {
  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="center"
      p={3}
      sx={{
        border: "1px solid var(--border-default-grey)",
        width: "100%",
      }}
    >
      <Box
        component="img"
        src={"/images/mission-locale-valid-tick.svg"}
        alt={""}
        sx={{
          width: "50px",
          height: "auto",
          userSelect: "none",
        }}
      />

      <Box>
        <Typography variant="body1" fontWeight="bold" textAlign="left">
          Tous les jeunes en rupture ce mois-ci ont été contacté !
        </Typography>
        <Typography variant="body2" textAlign="left">
          Retrouvez-les dans la liste{" "}
          <Link href="#" className="fr-link" color="primary" onClick={() => handleSectionChange?.("deja-traite")}>
            des dossiers déjà traités →
          </Link>
        </Typography>
      </Box>
    </Stack>
  );
};
