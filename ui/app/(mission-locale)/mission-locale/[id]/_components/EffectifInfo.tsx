"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Box, Collapse, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useState } from "react";
import { API_EFFECTIF_LISTE, IEffecifMissionLocale, IMissionLocaleEffectifList } from "shared";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { formatDate, getAge, getMonthYearFromDate } from "@/app/_utils/date.utils";

import { Feedback } from "./Feedback";

export function EffectifInfo({
  effectif,
  nomListe,
}: {
  effectif: IEffecifMissionLocale["effectif"];
  nomListe: IMissionLocaleEffectifList;
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
        <Stack direction="row" spacing={1} mb={2} alignItems="center">
          {effectif.injoignable ? (
            <Badge severity="info">Contacté sans réponse</Badge>
          ) : effectif.a_traiter && effectif.prioritaire ? (
            <p className="fr-badge fr-badge--orange-terre-battue" style={{ gap: "0.5rem" }}>
              <i className="fr-icon-fire-fill fr-icon--sm" /> À TRAITER EN PRIORITÉ
            </p>
          ) : effectif.a_traiter ? (
            <Badge severity="new">à traiter</Badge>
          ) : (
            <Badge severity="success">traité</Badge>
          )}

          <p className="fr-badge fr-badge--beige-gris-galet">{getMonthYearFromDate(effectif.dernier_statut?.date)}</p>
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
      </Stack>

      {!effectif.a_traiter && !effectif.injoignable && <Feedback situation={effectif.situation || {}} />}
      <PersonalInfoSection effectif={effectif} infosOpen={infosOpen} setInfosOpen={setInfosOpen} />
    </Stack>
  );
}

function PersonalInfoSection({ effectif, infosOpen, setInfosOpen }) {
  const withDefaultFallback = (data, defaultText, value?) => {
    const defaultValue = value ?? "";
    return data ? defaultValue : <span style={{ color: "#666666", fontStyle: "italic" }}>{defaultText}</span>;
  };

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
          <Typography display="inline">
            Réside à{" "}
            {withDefaultFallback(effectif.adresse?.commune, "commune non renseignée", effectif.adresse?.commune)}{" "}
            {withDefaultFallback(effectif.adresse?.code_postal, null, `(${effectif.adresse?.code_postal})`)}
          </Typography>
          <Typography display="inline">
            {withDefaultFallback(
              effectif.formation?.libelle_long,
              "Intitulé de la formation non renseigné",
              effectif.formation?.libelle_long
            )}
          </Typography>
          <Typography display="inline">
            {withDefaultFallback(
              effectif.organisme?.nom,
              "Organisme de formation non renseigné",
              effectif.organisme?.nom
            )}{" "}
            {withDefaultFallback(
              effectif.organisme?.adresse?.departement,
              null,
              `(${effectif.organisme?.adresse?.departement})`
            )}
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
              {effectif.organisme?.contacts_from_referentiel?.map((contact, idx) => (
                <Stack key={idx} spacing={1}>
                  <Typography>E-mail : {contact.email || "non renseigné"}</Typography>
                </Stack>
              ))}
              {effectif.contacts_tdb?.map(({ email, telephone, nom, prenom, fonction }, idx) => (
                <Stack key={idx} direction="column" spacing={1}>
                  <Typography>
                    {nom} {prenom} {fonction ? `(${fonction})` : ""}
                  </Typography>
                  <Typography>E-mail : {email || "non renseigné"}</Typography>
                  <Typography>Téléphone : {telephone || "non renseigné"}</Typography>
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
            <Typography>{effectif.telephone_corrected || effectif.telephone || ""}</Typography>
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
