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
      <Stack direction="column" spacing={1}>
        <Tag>{situation.situation ? SITUATION_LABEL_ENUM[situation.situation] : "Situation inconnue"}</Tag>
        {situation.situation === "AUTRE" && (
          <Typography
            variant="body2"
            sx={{
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
            }}
          >
            ({situation.situation_autre})
          </Typography>
        )}
      </Stack>

      <Typography fontWeight="bold" gutterBottom>
        Ce jeune était-il déjà connu de votre Mission Locale ?
      </Typography>
      <Tag>{situation.deja_connu ? "Oui" : "Non"}</Tag>

      <Typography fontWeight="bold" gutterBottom>
        Commentaires
      </Typography>
      <Typography
        sx={{
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
        }}
      >
        {situation.commentaires || "Aucun commentaire"}
      </Typography>
    </Stack>
  );
}
