"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { notFound } from "next/navigation";

import styles from "./error.module.css";

export default function ErrorComponent() {
  return (
    <div className="fr-container">
      <div className={styles.content}>
        <h1>Une erreur est survenue</h1>
        <p>Impossible de traiter votre demande pour le moment.</p>
        <Button onClick={() => notFound()}>Retour</Button>
      </div>
    </div>
  );
}
