"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { notFound } from "next/navigation";

export default function ErrorComponent() {
  return (
    <div className="fr-container">
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <h1 className="fr-h1">Une erreur est survenue</h1>
        <p className="fr-text">Impossible de traiter votre demande pour le moment.</p>
        <Button onClick={() => notFound()}>Retour</Button>
      </div>
    </div>
  );
}
