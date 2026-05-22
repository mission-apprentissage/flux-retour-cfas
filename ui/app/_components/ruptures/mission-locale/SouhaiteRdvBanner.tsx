"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useMlBannerStats } from "@/app/_components/ruptures/shared/hooks";

import styles from "./SouhaiteRdvBanner.module.css";

/**
 * Bannière "Souhaite un RDV" en haut de la page d'accueil ML.
 */
export function SouhaiteRdvBanner() {
  const router = useRouter();
  const { data } = useMlBannerStats();
  const [dismissed, setDismissed] = useState(false);

  const count = data?.souhaite_rdv_count ?? 0;
  if (dismissed || count <= 0) return null;

  const plural = count > 1;

  return (
    <div
      className={styles.banner}
      onClick={() => router.push("/mission-locale?filter=souhaite_rdv")}
      role="link"
      tabIndex={0}
    >
      <div className={styles.bannerContent}>
        <span className={`fr-icon-info-fill ${styles.bannerIcon}`} aria-hidden="true" />
        <div className={styles.bannerText}>
          <span className={styles.bannerTitle}>
            {count} jeune{plural ? "s" : ""} souhaite{plural ? "nt" : ""} un rendez-vous !
          </span>
          <span className={styles.bannerDescription}>
            Pour vous aider à passer des appels plus ciblés, nous avons contacté les jeunes prioritaires par message.
            Certains ont demandé à prendre RDV avec la Mission Locale, ils sont prêts et motivés !
          </span>
          <span className={styles.bannerDescription}>Contactez-les dès maintenant.</span>
          <span className={styles.bannerFooter}>
            Ils sont indiqués par cette étiquette dans votre liste prioritaire.
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
