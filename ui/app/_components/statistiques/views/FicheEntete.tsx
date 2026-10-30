"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Breadcrumb } from "@codegouvfr/react-dsfr/Breadcrumb";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Fragment, useState, type ReactNode } from "react";

import { _post } from "@/common/httpClient";
import { getApiErrorMessage } from "@/common/rateLimit";

import styles from "./FicheDetailView.module.css";

export const IMPOSTURE_TERRITOIRE_URL = "/api/v1/organisation/indicateurs-ml/impersonate";

export interface FicheImposture {
  /** Imposture admin par défaut ; IMPOSTURE_TERRITOIRE_URL pour l'imposture en lecture seule des acteurs de territoire. */
  url?: string;
  corps: Record<string, unknown>;
  redirection: string;
  desactivee?: boolean;
}

interface FicheEnteteProps {
  parent: { label: string; href: string };
  titre: string;
  statuts: ReactNode[];
  imposture?: FicheImposture;
}

export function FicheEntete({ parent, titre, statuts, imposture }: FicheEnteteProps) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const lancerImposture = async () => {
    if (!imposture || enCours) return;
    setEnCours(true);
    setErreur(null);
    try {
      await _post(imposture.url ?? "/api/v1/admin/impersonate", imposture.corps);
      window.location.href = imposture.redirection;
    } catch (err) {
      setErreur(getApiErrorMessage(err, "L'imposture a échoué. Merci de réessayer."));
      setEnCours(false);
    }
  };

  return (
    <>
      <Breadcrumb
        className={styles.breadcrumb}
        currentPageLabel={titre}
        segments={[{ label: parent.label, linkProps: { href: parent.href } }]}
      />
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <span className={`fr-icon-map-pin-user-line ${styles.titleIcon}`} aria-hidden="true" />
          <h1 className={styles.title}>{titre}</h1>
          {imposture && (
            <Button
              priority="secondary"
              iconId="fr-icon-eye-line"
              iconPosition="right"
              onClick={lancerImposture}
              disabled={imposture.desactivee || enCours}
              className={styles.imposture}
            >
              Imposture
            </Button>
          )}
        </div>
        <p className={styles.statuts}>
          {statuts.map((statut, index) => (
            <Fragment key={index}>
              {index > 0 && <span aria-hidden="true">•</span>}
              {statut}
            </Fragment>
          ))}
        </p>
        {erreur && (
          <Alert severity="error" title={erreur} description="" small closable onClose={() => setErreur(null)} />
        )}
      </header>
    </>
  );
}
