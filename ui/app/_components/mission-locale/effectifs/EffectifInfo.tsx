"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Box, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { API_EFFECTIF_LISTE, IEffecifMissionLocale, IMissionLocaleEffectifList } from "shared";

import { formatDate, getMonthYearFromDate } from "@/app/_utils/date.utils";

import { ConfirmReset } from "./ConfirmReset";
import { EffectifInfoDetails } from "./EffectifInfoDetails";
import { Feedback } from "./Feedback";

const StatusChangeInformation = ({ date }: { date?: Date | null }) => {
  const now = new Date();
  const defaultText = "Il a été indiqué que ce jeune a retrouvé un nouveau contrat";
  if (!date) return defaultText;

  const text =
    new Date(date) < now
      ? `${defaultText}, qui a débuté le ${formatDate(date)}`
      : `${defaultText}, qui va débuter le ${formatDate(date)}`;
  return (
    <Box pl={32} mt={2}>
      <Typography component="p" className="fr-text--sm" color="var(--background-flat-red-marianne)">
        {text}
      </Typography>
    </Box>
  );
};
export function EffectifInfo({
  effectif,
  nomListe,
  isAdmin = false,
  setIsEditable,
}: {
  effectif: IEffecifMissionLocale["effectif"];
  nomListe: IMissionLocaleEffectifList;
  isAdmin?: boolean;
  setIsEditable?: (isEditable: boolean) => void;
}) {
  const [infosOpen, setInfosOpen] = useState(false);
  const isListePrioritaire = nomListe === API_EFFECTIF_LISTE.PRIORITAIRE;

  const computeTransmissionDate = (date) => {
    return date ? `le ${formatDate(date)}` : "il y a plus de deux semaines";
  };

  return (
    <Stack
      spacing={2}
      sx={{
        py: { xs: 2, md: 4 },
      }}
    >
      <Stack
        p={{ xs: 2, md: 3 }}
        mt={4}
        sx={{
          background: isListePrioritaire ? "var(--background-alt-blue-france)" : "white",
        }}
      >
        <Stack direction="row" spacing={1} mb={2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            {effectif.injoignable ? (
              <Badge severity="info">Contacté sans réponse</Badge>
            ) : effectif.a_traiter && (effectif.prioritaire || effectif.a_contacter) ? (
              <p className="fr-badge fr-badge--orange-terre-battue" style={{ gap: "0.5rem" }}>
                <i className="fr-icon-fire-fill fr-icon--sm" /> À TRAITER EN PRIORITÉ
              </p>
            ) : effectif.a_traiter ? (
              <Badge severity="new">à traiter</Badge>
            ) : (
              <Badge severity="success">traité</Badge>
            )}
            <p className="fr-badge fr-badge--beige-gris-galet">{getMonthYearFromDate(effectif.date_rupture)}</p>
          </Stack>

          {isAdmin && !effectif.a_traiter && (
            <Stack direction="row" spacing={1} alignItems="center">
              <ConfirmReset />

              {!effectif.injoignable && (
                <Button size="small" priority="secondary" onClick={() => setIsEditable?.(true)}>
                  Modifier
                </Button>
              )}
            </Stack>
          )}
        </Stack>

        <Stack spacing={1}>
          <Typography
            variant="h3"
            className="fr-text--blue-france"
            sx={{ fontSize: { xs: "1.25rem", md: "1.75rem" }, margin: 0 }}
          >
            {effectif.nom} {effectif.prenom}
          </Typography>
          <Box
            className="fr-notice fr-notice--info"
            sx={{ backgroundColor: isListePrioritaire ? "var(--background-alt-blue-france)" : "white", p: 0 }}
          >
            <Box className="fr-notice__body">
              <Typography component="p">
                <span className="fr-notice__title">Date de la rupture du contrat d&apos;apprentissage :</span>
                <span className="fr-notice__desc">
                  {formatDate(effectif.date_rupture) ? `le ${formatDate(effectif.date_rupture)}` : "non renseignée"}
                </span>
              </Typography>
            </Box>
            <Typography variant="caption" color="grey" gutterBottom sx={{ fontStyle: "italic" }}>
              {effectif.source === "DECA" ? (
                <span>Données transmises par l&apos;API DECA {computeTransmissionDate(effectif.transmitted_at)}</span>
              ) : (
                <span>Données transmises par le CFA {computeTransmissionDate(effectif.transmitted_at)}</span>
              )}
            </Typography>
          </Box>
        </Stack>
        {typeof effectif?.autorisation_contact === "boolean" && (
          <Box className="fr-highlight" mt={2}>
            <Typography component="p" className="fr-text--sm">
              {effectif.nom} {effectif.prenom}
              {effectif.autorisation_contact
                ? " a indiqué avoir besoin d'être accompagné par vos services "
                : " a indiqué ne pas avoir besoin d'être accompagné par vos services "}
              (campagne emailing).
            </Typography>
          </Box>
        )}
        {effectif?.current_status?.value === "APPRENTI" && (
          <StatusChangeInformation date={effectif?.current_status?.date} />
        )}
      </Stack>

      {!effectif.a_traiter && !effectif.injoignable && <Feedback situation={effectif.situation || {}} />}

      <EffectifInfoDetails effectif={effectif} infosOpen={infosOpen} setInfosOpen={setInfosOpen} />
    </Stack>
  );
}
