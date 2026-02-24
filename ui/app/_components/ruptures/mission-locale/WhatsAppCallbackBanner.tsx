"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import styles from "./WhatsAppCallbackBanner.module.css";

interface WhatsAppCallbackBannerProps {
  count: number;
}

export function WhatsAppCallbackBanner({ count }: WhatsAppCallbackBannerProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || count <= 0) return null;

  return (
    <div
      className={styles.banner}
      onClick={() => router.push("/mission-locale?statut=injoignable_prioritaire")}
      role="link"
      tabIndex={0}
    >
      <div className={styles.bannerContent}>
        <span className={`fr-icon-info-fill ${styles.bannerIcon}`} aria-hidden="true" />
        <div className={styles.bannerText}>
          <span className={styles.bannerTitle}>
            {count} {count > 1 ? "jeunes ont demandé" : "jeune a demandé"} à être recontacté
            {count > 1 ? "s" : ""} récemment
          </span>
          <span className={styles.bannerDescription}>
            Nous avons envoyé une relance aux jeunes qui n&apos;avaient pas répondu à votre premier appel. Ceux qui
            souhaitent être rappelés nous ont répondu.
            <br />
            Nous vous conseillons de les recontacter rapidement.
          </span>
          <span className={styles.bannerLink}>
            Ils sont dans votre dossier <strong>&quot;À recontacter&quot;</strong>
          </span>
        </div>
      </div>
      <button
        className={styles.closeButton}
        onClick={(e) => {
          e.stopPropagation();
          setDismissed(true);
        }}
        aria-label="Fermer"
      >
        <span className="fr-icon-close-line" aria-hidden="true" />
      </button>
    </div>
  );
}
