"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";

export default function ErrorComponent({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="fr-container fr-py-4w">
      <Alert
        severity="error"
        title="Une erreur est survenue"
        description="Impossible de traiter votre demande pour le moment."
      />
      <Button priority="secondary" className="fr-mt-2w" onClick={reset}>
        Réessayer
      </Button>
    </div>
  );
}
