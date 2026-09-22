"use client";

import { ORGANISATION_TYPE } from "shared";

import { LOCAL_STORAGE_KEYS } from "@/app/_constants/localStorage";
import { useAuth } from "@/app/_context/UserContext";

import { useDismissible } from "./ruptures/shared/hooks";
import { DismissButton } from "./ruptures/shared/ui/DismissButton";
import styles from "./TravauxBanner.module.css";

const ORGANISATION_TYPES_CONCERNES: string[] = [ORGANISATION_TYPE.DREETS, ORGANISATION_TYPE.DDETS];

export function TravauxBanner() {
  const { user } = useAuth();
  const { visible, dismiss } = useDismissible(LOCAL_STORAGE_KEYS.DREETS_TRAVAUX_BANNER_DISMISSED);

  if (!visible || !ORGANISATION_TYPES_CONCERNES.includes(user?.organisation?.type ?? "")) return null;

  return (
    <div className={styles.banner} role="region" aria-label="Travaux en cours sur le service">
      <div className={`fr-container ${styles.inner}`}>
        <div className={styles.content}>
          <span className={`fr-icon-warning-fill ${styles.icon}`} aria-hidden="true" />
          <div>
            <p className={styles.title}>Travaux sur le service du Tableau de bord de l&apos;apprentissage</p>
            <p className={styles.subtitle}>
              Certaines fonctionnalités sont mises en pause durant les travaux de rentrée sur le service
            </p>
          </div>
        </div>
        <DismissButton onDismiss={dismiss} label="Fermer le bandeau d'information sur les travaux" />
      </div>
    </div>
  );
}
