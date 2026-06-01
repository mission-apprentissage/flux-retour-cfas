import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";

import styles from "./OnboardingError.module.scss";

type OnboardingErrorProps = {
  description: string;
  title?: string;
  backHref: string;
  backLabel?: string;
};

export function OnboardingError({
  description,
  title = "Erreur",
  backHref,
  backLabel = "Retour à la connexion",
}: OnboardingErrorProps) {
  return (
    <div className={styles.container}>
      <Alert severity="error" title={title} description={description} />
      <Button priority="secondary" linkProps={{ href: backHref }} className={styles.backButton}>
        {backLabel}
      </Button>
    </div>
  );
}
