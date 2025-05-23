import { fr } from "@codegouvfr/react-dsfr";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { Stack, Typography } from "@mui/material";

import { capitalizeWords } from "@/common/utils/stringUtils";

export const MissionLocaleFaq = ({
  missionLocalNom,
  organismeNom,
  missionLocaleUrl,
  lbaUrl,
}: {
  missionLocalNom: string;
  organismeNom: string;
  missionLocaleUrl: string;
  lbaUrl: string;
}) => {
  return (
    <>
      <Typography fontWeight="bold">Encore des questions ?</Typography>
      <div className={fr.cx("fr-accordions-group")}>
        <Accordion label={`La Mission Locale ${capitalizeWords(missionLocalNom)} ?`}>
          <Stack spacing={3} px={1}>
            <Typography>
              <strong>La Mission Locale {capitalizeWords(missionLocalNom)}</strong> accueille les jeunes de 16 à 25 ans
              et jusqu’à 29 ans pour les personnes en situation de handicap.
            </Typography>
            <Typography>
              <a href={missionLocaleUrl} target="_blank" rel="noopener noreferrer" className="fr-link">
                Consulter le site pour en savoir plus et trouver l’antenne proche de chez vous en cliquant ici&nbsp;!
              </a>
            </Typography>
          </Stack>
        </Accordion>
        <Accordion label="Comment trouver des offres d’emploi en lien avec ma formation ?">
          <Stack spacing={3} px={1}>
            <Typography>
              <strong>La bonne alternance est le site pour trouver une alternance.</strong> Il centralise toutes les
              formations en apprentissage, ainsi que de nombreuses opportunités d’emplois en alternance. Vous pouvez
              contacter les écoles pour vous renseigner sur leurs formations, et postuler auprès de nombreuses
              entreprises.
            </Typography>
            <Typography>
              <a href={lbaUrl} target="_blank" rel="noopener noreferrer" className="fr-link">
                Consultez les opportunités d’emplois en lien avec votre formation en cliquant ici&nbsp;!
              </a>
            </Typography>
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
            </Typography>
          </Stack>
        </Accordion>
        <Accordion label="Comment avez-vous eu connaissance de ma situation et de mes coordonnées ?">
          <Stack spacing={3} px={1}>
            <Typography>
              C’est votre établissement <strong>{capitalizeWords(organismeNom)}</strong> qui nous a informé de votre
              situation et qui nous a communiqué vos coordonnées afin que nous puissions vous proposer un
              accompagnement.
            </Typography>
            <Typography>
              Nous ne faisons aucune utilisation commerciale de vos coordonnées et adresses e-mail.
            </Typography>
            <Typography>
              Vous bénéficiez d’un droit d’opposition que vous pouvez utiliser à tout moment via l’adresse{" "}
              <a href="mailto:tableaudebord@apprentissage.beta.gouv.fr" className="fr-link">
                tableaudebord@apprentissage.beta.gouv.fr
              </a>
              . Votre adresse e-mail sera dès lors supprimée de notre base de données et vous ne serez plus contacté. Si
              vous pensez que vos droits ne sont pas respectés, vous pouvez à tout moment{" "}
              <a
                href="https://www.cnil.fr/fr/adresser-une-plainte"
                target="_blank"
                rel="noopener noreferrer"
                className="fr-link"
              >
                adresser une plainte à la CNIL
              </a>
              .
            </Typography>
          </Stack>
        </Accordion>
      </div>
    </>
  );
};
