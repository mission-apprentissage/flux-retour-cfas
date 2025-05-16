"use client";

import { Box, Collapse, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { formatDate, getAge } from "@/app/_utils/date.utils";

export function EffectifInfoDetails({ effectif, infosOpen, setInfosOpen }) {
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
