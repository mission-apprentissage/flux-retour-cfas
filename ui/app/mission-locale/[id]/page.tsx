"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
  Collapse,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";

import { DsfrLink } from "@/app/_components/link/DsfrLink";
import { formatDate, getAge, getMonthYearFromDate } from "@/app/_utils/date.utils";
import { _get } from "@/common/httpClient";

export default function Page() {
  const [infosOpen, setInfosOpen] = useState(false);
  const params = useParams();
  const id = params?.id;

  const { data, isLoading, error } = useQuery(
    ["effectif", id],
    async () => {
      if (!id) return null;
      return await _get(`/api/v1/organisation/mission-locale/effectif/${id}`);
    },
    { enabled: !!id, keepPreviousData: true }
  );
  console.log("CONSOLE LOG ~ Page ~ data:", data);

  if (isLoading) {
    return <Typography>Chargement…</Typography>;
  }
  if (error) {
    return <Typography>Une erreur est survenue.</Typography>;
  }
  if (!data) {
    return <Typography>Aucune donnée à afficher.</Typography>;
  }

  const nom = data.nom ?? "";
  const prenom = data.prenom ?? "";
  const telephone = data.telephone ?? "";
  const courriel = data.courriel ?? "";
  const rqth = data.rqth ? "oui" : "non";
  const naissance = formatDate(data.date_de_naissance);
  const age = getAge(data.date_de_naissance);
  const dateRupture = formatDate(data.contrats?.[0]?.date_rupture);
  const transmittedAt = formatDate(data.transmitted_at);

  const libelleFormation = data.formation?.libelle_long ?? "";
  const commune = data.organisme?.adresse?.commune ?? "";
  const codePostal = data.organisme?.adresse?.code_postal ?? "";
  const departement = data.organisme?.adresse?.departement ?? "";

  const responsableLegalNom = data.formation?.referent_handicap?.nom ?? "";
  const responsableLegalPrenom = data.formation?.referent_handicap?.prenom ?? "";
  const responsableLegalEmail = data.formation?.referent_handicap?.email ?? "";

  const dernierStatutDate = data.dernier_statut?.date;
  const displayedMonthYear = getMonthYearFromDate(dernierStatutDate);

  const contrat = data.contrats;
  const cfaContacts = data.organisme?.contacts_from_referentiel;

  return (
    <Grid container spacing={2}>
      <Grid size={3}>
        <DsfrLink href="/mission-locale" arrow="left">
          Retour à la liste
        </DsfrLink>
      </Grid>

      <Grid
        size={9}
        pl={4}
        sx={{
          "--Grid-borderWidth": "1px",
          borderLeft: "var(--Grid-borderWidth) solid",
          borderColor: "var(--border-default-grey)",
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          p={2}
          sx={{ border: "1px solid var(--border-default-grey)" }}
        >
          <DsfrLink href="/mission-locale" arrow="left">
            Précédent
          </DsfrLink>
          <Box display="flex" alignItems="center">
            <Typography fontWeight="bold">Dossier n°12 sur les 13 encore à traiter</Typography>
            <Typography component="span" sx={{ marginLeft: 1 }}>
              (tous mois confondus)
            </Typography>
          </Box>
          <DsfrLink href="/mission-locale" arrow="right">
            Suivant
          </DsfrLink>
        </Box>

        <Stack direction="column" spacing={2} py={6}>
          <Stack direction="row" spacing={2}>
            <Badge severity="new">à traiter</Badge>
            <Badge>{displayedMonthYear}</Badge>
          </Stack>

          <Stack direction="column" spacing={1}>
            <h3 className="fr-h3 fr-text--blue-france">
              {nom} {prenom}
            </h3>
            <div className="fr-notice fr-notice--info" style={{ backgroundColor: "white", padding: "0" }}>
              <div className="fr-notice__body">
                <p>
                  <span className="fr-notice__title">Date de la rupture du contrat d’apprentissage :</span>
                  <span className="fr-notice__desc">{dateRupture ? `le ${dateRupture}` : "non renseignée"}</span>
                </p>
              </div>
              <Typography variant="caption" color="grey" gutterBottom sx={{ fontStyle: "italic" }}>
                Données transmises par l’API DECA le {transmittedAt}
              </Typography>
            </div>
          </Stack>
          <Grid container spacing={2} p={3} sx={{ backgroundColor: "var(--background-default-grey-active)" }}>
            <Grid size={8}>
              <Stack direction="column" spacing={1}>
                <Typography>
                  Née le {naissance} ({age || "?"} ans)
                </Typography>
                <Typography>
                  Réside à {commune} ({codePostal})
                </Typography>
                <Typography>{libelleFormation}</Typography>
                <Typography>
                  {commune} ({departement})
                </Typography>
                <Typography>RQTH : {rqth}</Typography>
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
                    <Typography fontWeight="bold">Contrat d’apprentissage</Typography>
                    {contrat?.map((c) => (
                      <Stack key={c.id} direction="column" spacing={1}>
                        <Typography>Date de début : {formatDate(c.date_debut) || "non renseignée"}</Typography>
                        <Typography>Date de fin : {formatDate(c.date_fin) || "non renseignée"}</Typography>
                        <Typography>Cause de rupture : {c.cause_rupture || "non renseignée"}</Typography>
                      </Stack>
                    ))}
                    <Typography mt={1} fontWeight="bold">
                      Coordonnées du CFA
                    </Typography>
                    {cfaContacts?.map((contact) => (
                      <Stack key={contact.id} direction="column" spacing={1}>
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
                  <Typography>{telephone}</Typography>
                  <Typography>{courriel}</Typography>
                </Stack>
              </Box>
              <Box>
                <Stack direction="column" spacing={1}>
                  <Typography fontWeight="bold">Responsable légal</Typography>
                  <Typography>
                    {responsableLegalPrenom} {responsableLegalNom}
                  </Typography>
                  <Typography>{responsableLegalEmail}</Typography>
                </Stack>
              </Box>
            </Grid>
          </Grid>

          <Box p={2} sx={{ border: "1px solid var(--border-default-grey)" }}>
            <FormControl component="fieldset" fullWidth sx={{ marginBottom: 3 }}>
              <FormLabel component="legend">Quel est votre retour sur la prise de contact ?</FormLabel>
              <RadioGroup name="prise-contact">
                <FormControlLabel
                  value="rdv_mission_locale"
                  control={<Radio />}
                  label="Rendez-vous pris à la Mission Locale"
                />
                <FormControlLabel value="pas_de_suivi" control={<Radio />} label="Pas besoin de suivi" />
                <FormControlLabel value="contacte_sans_retour" control={<Radio />} label="Contacté mais sans retour" />
                <FormControlLabel value="coord_incorrectes" control={<Radio />} label="Coordonnées incorrectes" />
                <FormControlLabel value="autre" control={<Radio />} label="Autre situation / retour" />
              </RadioGroup>
            </FormControl>

            <FormControl component="fieldset" fullWidth sx={{ marginBottom: 3 }}>
              <FormLabel component="legend">Ce jeune était déjà connu de votre Mission Locale ?</FormLabel>
              <RadioGroup name="connu_mission_locale" row>
                <FormControlLabel value="oui" control={<Radio />} label="Oui" />
                <FormControlLabel value="non" control={<Radio />} label="Non" />
              </RadioGroup>
            </FormControl>

            <TextField label="Avez-vous des commentaires ? (optionnel)" multiline rows={3} fullWidth />
          </Box>

          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Button variant="outlined">Valider et quitter</Button>
            <Button variant="contained">Valider et passer au suivant</Button>
          </Stack>
        </Stack>
      </Grid>
    </Grid>
  );
}
