"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useMlBannerStats } from "@/app/_components/ruptures/shared/hooks";

import { SouhaiteRdvBadgeInline } from "../shared/ui/EffectifStatusBadge";

import styles from "./SouhaiteRdvBanner.module.css";

const DISMISS_STORAGE_KEY = "souhaite_rdv_banner_dismissed_at";

/**
 * Bannière "Souhaite un RDV" en haut de la page d'accueil ML.
 */
export function SouhaiteRdvBanner() {
  const router = useRouter();
  const { data } = useMlBannerStats();
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_STORAGE_KEY) !== null);
    } catch {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, new Date().toISOString());
    } catch {
      //empty
    }
    setDismissed(true);
  };

  const count = data?.souhaite_rdv_count ?? 0;
  if (dismissed !== false || count <= 0) return null;

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
            Ils sont indiqués par cette étiquette
            <span className={styles.bannerBadgeWrapper}>
              <SouhaiteRdvBadgeInline />
            </span>
          </span>
        </div>
      </div>
      <button className={styles.closeButton} onClick={handleDismiss} aria-label="Fermer">
        <span className="fr-icon-close-line" aria-hidden="true" />
      </button>
    </div>
  );
}
