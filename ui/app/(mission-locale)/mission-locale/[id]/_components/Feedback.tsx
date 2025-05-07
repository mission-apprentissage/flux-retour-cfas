"use client";

import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { Stack, Typography } from "@mui/material";
import { IUpdateMissionLocaleEffectif, SITUATION_LABEL_ENUM } from "shared";

export function Feedback({ situation }: { situation: IUpdateMissionLocaleEffectif }) {
  return (
    <Stack p={2} spacing={2} sx={{ border: "1px solid var(--border-default-blue-france)" }}>
      <Typography fontWeight="bold" gutterBottom>
        Quel est votre retour sur la prise de contact ?
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <Tag>{situation.situation ? SITUATION_LABEL_ENUM[situation.situation] : "Situation inconnue"}</Tag>
        {situation.situation === "AUTRE" && <Typography variant="body2">({situation.situation_autre})</Typography>}
      </Stack>

      <Typography fontWeight="bold" gutterBottom>
        Ce jeune était-il déjà connu de votre Mission Locale ?
      </Typography>
      <Tag>{situation.deja_connu ? "Oui" : "Non"}</Tag>

      <Typography fontWeight="bold" gutterBottom>
        Commentaires
      </Typography>
      <Typography>{situation.commentaires || "Aucun commentaire"}</Typography>
    </Stack>
  );
}
