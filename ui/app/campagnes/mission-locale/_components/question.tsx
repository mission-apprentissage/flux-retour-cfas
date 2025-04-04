import { Button } from "@codegouvfr/react-dsfr/Button";
import { Typography } from "@mui/material";

export const MissionLocaleQuestion = () => {
  return (
    <>
      <Typography fontWeight="bold">Un doute ?</Typography>
      <Button
        iconId="fr-icon-chat-2-fill"
        priority="secondary"
        linkProps={{
          href: "https://aide.cfas.apprentissage.beta.gouv.fr/fr/",
          target: "_blank",
          rel: "noopener noreferrer",
        }}
      >
        Posez-nous votre question
      </Button>
    </>
  );
};
