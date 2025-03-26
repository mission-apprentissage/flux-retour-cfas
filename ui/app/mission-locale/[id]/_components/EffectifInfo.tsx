"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Box, Collapse, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useState } from "react";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { formatDate, getAge, getMonthYearFromDate } from "@/app/_utils/date.utils";

import { Feedback } from "./Feedback";

export function EffectifInfo({ effectif }) {
  const [infosOpen, setInfosOpen] = useState(false);

  const computeTransmissionDate = (date) => {
    return date ? `le ${formatDate(date)}` : "il y a plus de deux semaines";
  };

  return (
    <Stack
      spacing={2}
      sx={{
        py: { xs: 2, md: 6 },
      }}
    >
      <Stack direction="row" spacing={1}>
        {effectif.a_traiter ? <Badge severity="new">à traiter</Badge> : <Badge severity="success">traité</Badge>}
        <Badge>{getMonthYearFromDate(effectif.dernier_statut?.date)}</Badge>
      </Stack>

      <Stack spacing={1}>
        <Typography
          variant="h3"
          className="fr-text--blue-france"
          sx={{ fontSize: { xs: "1.25rem", md: "1.75rem" }, margin: 0 }}
        >
          {effectif.nom} {effectif.prenom}
        </Typography>
        <Box className="fr-notice fr-notice--info" sx={{ backgroundColor: "white", p: 0 }}>
          <Box className="fr-notice__body">
            <Typography component="p">
              <span className="fr-notice__title">Date de la rupture du contrat d&apos;apprentissage :</span>
              <span className="fr-notice__desc">
                {formatDate(effectif.contrats?.[0]?.date_rupture)
                  ? `le ${formatDate(effectif.contrats?.[0]?.date_rupture)}`
                  : "non renseignée"}
              </span>
            </Typography>
          </Box>
          <Typography variant="caption" color="grey" gutterBottom sx={{ fontStyle: "italic" }}>
            {effectif.source === "API_DECA" ? (
              <span>Données transmises par l&apos;API DECA {computeTransmissionDate(effectif.transmitted_at)}</span>
            ) : (
              <span>Données transmises par le CFA {computeTransmissionDate(effectif.transmitted_at)}</span>
            )}
          </Typography>
        </Box>
      </Stack>

      {effectif.situation && Object.keys(effectif.situation).length > 0 && <Feedback situation={effectif.situation} />}
      <PersonalInfoSection effectif={effectif} infosOpen={infosOpen} setInfosOpen={setInfosOpen} />
    </Stack>
  );
}

function PersonalInfoSection({ effectif, infosOpen, setInfosOpen }) {
  return (
    <Grid
      container
      spacing={2}
      sx={{
        backgroundColor: "var(--background-default-grey-active)",
        px: { xs: 2, sm: 3 },
        py: { xs: 2, sm: 3 },
      }}
    >
      <Grid size={{ xs: 12, md: 8 }}>
        <Stack spacing={1}>
          <Typography>
            Née le {formatDate(effectif.date_de_naissance)} ({getAge(effectif.date_de_naissance) || "?"} ans)
          </Typography>
          <Typography>
            Réside à {effectif.adresse?.commune} ({effectif.adresse?.code_postal})
          </Typography>
          <Typography>{effectif.formation?.libelle_long}</Typography>
          <Typography>
            {effectif.organisme?.adresse?.commune} ({effectif.organisme?.adresse?.departement})
          </Typography>
          <Typography>RQTH : {effectif.rqth ? "oui" : "non"}</Typography>
          <DsfrLink
            href="#"
            arrow="none"
            onClick={() => setInfosOpen((open) => !open)}
            className={`fr-link--icon-right ${infosOpen ? "ri-arrow-drop-up-line" : "ri-arrow-drop-down-line"}`}
          >
            Informations complémentaires
          </DsfrLink>
        </Stack>

        <Collapse in={infosOpen}>
          <Box mt={1}>
            <Stack spacing={1}>
              <Typography fontWeight="bold">Contrat d&apos;apprentissage</Typography>
              {effectif.contrats?.map((c, idx) => (
                <Stack key={idx} spacing={1}>
                  <Typography>Date de début : {formatDate(c.date_debut) || "non renseignée"}</Typography>
                  <Typography>Date de fin : {formatDate(c.date_fin) || "non renseignée"}</Typography>
                  <Typography>Cause de rupture : {c.cause_rupture || "non renseignée"}</Typography>
                </Stack>
              ))}
              <Typography mt={1} fontWeight="bold">
                Coordonnées du CFA
              </Typography>
              {effectif.organisme?.nom && <Typography>{effectif.organisme?.nom}</Typography>}
              {effectif.organisme?.contacts_from_referentiel?.map((contact, idx) => (
                <Stack key={idx} spacing={1}>
                  <Typography>E-mail : {contact.email || "non renseigné"}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Collapse>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Box mb={2}>
          <Stack spacing={1}>
            <Typography fontWeight="bold">Coordonnées</Typography>
            <Typography>{effectif.telephone || ""}</Typography>
            <Typography>{effectif.courriel || ""}</Typography>
          </Stack>
        </Box>
        {effectif.formation?.referent_handicap && (
          <Box>
            <Stack spacing={1}>
              <Typography fontWeight="bold">Responsable légal</Typography>
              <Typography>
                {effectif.formation?.referent_handicap?.prenom} {effectif.formation?.referent_handicap?.nom}
              </Typography>
              <Typography>{effectif.formation?.referent_handicap?.email}</Typography>
            </Stack>
          </Box>
        )}
      </Grid>
    </Grid>
  );
}
