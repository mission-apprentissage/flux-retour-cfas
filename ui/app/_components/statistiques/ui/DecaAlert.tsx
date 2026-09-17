"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { useEffect, useState } from "react";

import styles from "./DecaAlert.module.css";

const DISMISS_STORAGE_KEY = "deca-alert-dismissed";

export function DecaAlert() {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem(DISMISS_STORAGE_KEY)) {
      setDismissed(true);
    }
  }, []);

  if (dismissed) {
    return null;
  }

  return (
    <Alert
      onClose={() => {
        window.localStorage.setItem(DISMISS_STORAGE_KEY, "1");
        setDismissed(true);
      }}
      severity="info"
      small
      closable
      description={
        <>
          Le pic de rupturants en date du <strong>4 février 2026</strong> est dû à l&apos;intégration des rupturants{" "}
          <strong>DECA</strong>.{" "}
          <button type="button" onClick={() => setIsOpen(!isOpen)} className={styles.lien}>
            Qu&apos;est-ce que DECA ?
          </button>
          {isOpen && (
            <p className={styles.detail}>
              DECA (Dépôt des contrats en alternance) : base de données qui stocke les contrats d&apos;apprentissage des
              secteurs privé et public déposés par les 11 opérateurs de compétences (OPCO) et les agents en
              DDETS/D(R)(I)EETS.
            </p>
          )}
        </>
      }
    />
  );
}
