"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useEffect } from "react";

import { reportBoundaryError } from "@/common/reportError";

export default function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    reportBoundaryError(error, "cfa-detail");
  }, [error]);

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
