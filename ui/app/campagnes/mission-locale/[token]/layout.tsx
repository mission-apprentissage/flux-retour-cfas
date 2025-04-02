"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";

export default function RootLayout({ children }: { children: JSX.Element }) {
  const handlePoseQuestion = () => {
    alert("Button clicked!");
  };

  return (
    <Grid container maxWidth="md" margin="auto" sx={{ padding: "0 16px" }}>
      <Stack spacing={3} sx={{ width: "100%" }}>
        {children}
        <Typography fontWeight="bold">Un doute ?</Typography>
        <Button iconId="fr-icon-chat-2-fill" onClick={handlePoseQuestion} priority="secondary">
          Posez-nous votre question
        </Button>

        <Typography fontWeight="bold">Encore des questions ?</Typography>
        <div className={fr.cx("fr-accordions-group")}>
          <Accordion label="La Mission Locale de Marseille ?">
            <Stack spacing={3} px={1}>
              <Typography>
                <strong>La Mission Locale de Marseille</strong> accueille les jeunes de 16 à 25 ans et jusqu’à 29 ans
                pour les personnes en situation de handicap.
              </Typography>
              <Typography>
                Consulter le site pour en savoir plus et trouver l’antenne proche de chez vous en cliquant ici&nbsp;!
              </Typography>
            </Stack>
          </Accordion>
          <Accordion label="Comment trouver des offres d’emploi en lien avec ma formation ?">
            <Stack spacing={3} px={1}>
              <Typography>
                <strong>La bonne alternance est le site pour trouver une alternance.</strong> Il centralise toutes les
                formations en apprentissa ge, ainsi que de nombreuses opportunités d’emplois en alternance. Vous pouvez
                contacter les écoles pour vous renseigner sur leurs formations, et postuler auprès de nombreuses
                entreprises.
              </Typography>
              <Typography>
                Consultez les opportunités d’emplois en lien avec votre formation en cliquant ici&nbsp;!
              </Typography>{" "}
            </Stack>
          </Accordion>
          <Accordion label="Qui est à l’initiative de ce service ? Quel est le contexte ?">
            <Stack spacing={3} px={1}>
              <Typography>
                Ce service est développé par l’équipe du Tableau de bord de l’apprentissage conformément aux missions
                d’intérêt public du Ministère du Travail.
              </Typography>
              <Typography fontWeight="bold">
                Il s’agit d’une expérimentation en partenariat avec les Missions Locales qui a pour objectif d’aider les
                personnes en ruptures de contrat d’apprentissage à retrouver rapidement une place en entreprise.
              </Typography>{" "}
            </Stack>
          </Accordion>
          <Accordion label="Comment avez-vous eu connaissance de ma situation et de mes coordonnées ?">
            <Stack spacing={3} px={1}>
              <Typography>
                C’est votre établissement <strong>[nom de l’organisme]</strong> qui nous a informé de votre situation et
                qui nous a communiqué vos coordonnées afin que nous puissions vous proposer un accompagnement.
              </Typography>
              <Typography>
                Nous ne faisons aucune utilisation commerciale de vos coordonnées et adresses e-mail.
              </Typography>
              <Typography>
                Vous bénéficiez d’un droit d’opposition que vous pouvez utiliser à tout moment via l’adresse
                tableaudebord@apprentissage.beta.gouv.fr.
              </Typography>{" "}
            </Stack>
          </Accordion>
        </div>
      </Stack>
    </Grid>
  );
}
