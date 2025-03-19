import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Box, Collapse, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useState } from "react";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { formatDate, getAge, getMonthYearFromDate } from "@/app/_utils/date.utils";

import { Feedback } from "./Feedback";

export function EffectifInfo({ effectif }) {
  const [infosOpen, setInfosOpen] = useState(false);

  return (
    <Stack direction="column" spacing={2} py={6}>
      <Stack direction="row" spacing={2}>
        {effectif.a_traiter ? <Badge severity="new">à traiter</Badge> : <Badge severity="success">traité</Badge>}
        <Badge>{getMonthYearFromDate(effectif.dernier_statut?.date)}</Badge>
      </Stack>

      <Stack direction="column" spacing={1}>
        <h3 className="fr-h3 fr-text--blue-france">
          {effectif.nom} {effectif.prenom}
        </h3>
        <div className="fr-notice fr-notice--info" style={{ backgroundColor: "white", padding: "0" }}>
          <div className="fr-notice__body">
            <p>
              <span className="fr-notice__title">Date de la rupture du contrat d&apos;apprentissage :</span>
              <span className="fr-notice__desc">
                {formatDate(effectif.contrats?.[0]?.date_rupture)
                  ? `le ${formatDate(effectif.contrats?.[0]?.date_rupture)}`
                  : "non renseignée"}
              </span>
            </p>
          </div>
          <Typography variant="caption" color="grey" gutterBottom sx={{ fontStyle: "italic" }}>
            {effectif.source === "API_DECA" ? (
              <span>Données transmises par l&apos;API DECA le {formatDate(effectif.transmitted_at)}</span>
            ) : (
              <span>Données transmises par le CFA le {formatDate(effectif.transmitted_at)}</span>
            )}
          </Typography>
        </div>
      </Stack>

      {effectif.situation && Object.keys(effectif.situation).length > 0 && <Feedback situation={effectif.situation} />}
      <PersonalInfoSection effectif={effectif} infosOpen={infosOpen} setInfosOpen={setInfosOpen} />
    </Stack>
  );
}

function PersonalInfoSection({ effectif, infosOpen, setInfosOpen }) {
  return (
    <Grid container spacing={2} p={3} sx={{ backgroundColor: "var(--background-default-grey-active)" }}>
      <Grid size={8}>
        <Stack direction="column" spacing={1}>
          <Typography>
            Née le {formatDate(effectif.date_de_naissance)} ({getAge(effectif.date_de_naissance) || "?"} ans)
          </Typography>
          <Typography>
            Réside à {effectif.organisme?.adresse?.commune} ({effectif.organisme?.adresse?.code_postal})
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
            <Stack direction="column" spacing={1}>
              <Typography fontWeight="bold">Contrat d&apos;apprentissage</Typography>
              {effectif.contrats?.map((c, idx) => (
                <Stack key={idx} direction="column" spacing={1}>
                  <Typography>Date de début : {formatDate(c.date_debut) || "non renseignée"}</Typography>
                  <Typography>Date de fin : {formatDate(c.date_fin) || "non renseignée"}</Typography>
                  <Typography>Cause de rupture : {c.cause_rupture || "non renseignée"}</Typography>
                </Stack>
              ))}
              <Typography mt={1} fontWeight="bold">
                Coordonnées du CFA
              </Typography>
              {effectif.organisme?.contacts_from_referentiel?.map((contact, idx) => (
                <Stack key={idx} direction="column" spacing={1}>
                  <Typography>E-mail : {contact.email || "non renseigné"}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Collapse>
      </Grid>

      <Grid size={4}>
        <Box mb={2}>
          <Stack direction="column" spacing={1}>
            <Typography fontWeight="bold">Coordonnées</Typography>
            <Typography>{effectif.telephone || ""}</Typography>
            <Typography>{effectif.courriel || ""}</Typography>
          </Stack>
        </Box>
        <Box>
          <Stack direction="column" spacing={1}>
            <Typography fontWeight="bold">Responsable légal</Typography>
            <Typography>
              {effectif.formation?.referent_handicap?.prenom} {effectif.formation?.referent_handicap?.nom}
            </Typography>
            <Typography>{effectif.formation?.referent_handicap?.email}</Typography>
          </Stack>
        </Box>
      </Grid>
    </Grid>
  );
}
