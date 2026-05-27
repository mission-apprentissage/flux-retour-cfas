"use client";

import styles from "./brevo-contacts.module.scss";
import { type BrevoHealthCheck, useBrevoHealth } from "./hooks/useBrevoHealth";

// Statut global agrégé : un seul détail global ("OK", "config incomplète", "erreur")
// dérivé des 2 checks, avec un point coloré assorti.
const summarize = (apiKey: BrevoHealthCheck, list: BrevoHealthCheck): { dotClass: string; label: string } => {
  if (!apiKey.ok) return { dotClass: styles.healthDotError, label: "Brevo : clé API KO" };
  if (!list.ok && !list.configured)
    return { dotClass: styles.healthDotWarning, label: "Brevo : connecté, liste non configurée" };
  if (!list.ok) return { dotClass: styles.healthDotError, label: "Brevo : liste cible KO" };
  return { dotClass: styles.healthDotOk, label: "Brevo : connecté" };
};

export function BrevoHealthBanner() {
  const { data, isLoading, error } = useBrevoHealth();

  if (isLoading) {
    return (
      <div className={styles.health}>
        <span className={styles.healthSummary}>
          <span className={styles.healthDot} aria-hidden="true" />
          <span>Vérification Brevo…</span>
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.health}>
        <span className={styles.healthSummary}>
          <span className={`${styles.healthDot} ${styles.healthDotError}`} aria-hidden="true" />
          <span>Health-check Brevo indisponible — {error instanceof Error ? error.message : "erreur inconnue"}</span>
        </span>
      </div>
    );
  }

  const { dotClass, label } = summarize(data.apiKey, data.tbaContactsList);

  return (
    <details className={styles.health}>
      <summary className={styles.healthSummary}>
        <span className={`${styles.healthDot} ${dotClass}`} aria-hidden="true" />
        <span>{label}</span>
      </summary>
      <div className={styles.healthDetails}>
        <p className={styles.healthDetailLine}>
          {data.apiKey.label}&nbsp;: {data.apiKey.detail}
        </p>
        <p className={styles.healthDetailLine}>
          {data.tbaContactsList.label}&nbsp;: {data.tbaContactsList.detail}
        </p>
      </div>
    </details>
  );
}
