"use client";

import Link from "next/link";

import { LOCAL_STORAGE_KEYS } from "@/app/_constants/localStorage";

import { useDismissible } from "../shared/hooks";
import { DismissButton } from "../shared/ui/DismissButton";

import styles from "./CfaUpdateBanner.module.css";
import { useIsCfaBannerRoute } from "./hooks";

export function CfaUpdateBanner() {
  const isOnCfaTab = useIsCfaBannerRoute();
  const { visible, dismiss } = useDismissible(LOCAL_STORAGE_KEYS.CFA_V2_UPDATE_BANNER_DISMISSED);

  if (!isOnCfaTab || !visible) return null;

  return (
    <div className={styles.banner} role="region" aria-label="Mise à jour du Tableau de bord">
      <div className={`fr-container ${styles.inner}`}>
        <p className={styles.content}>
          <span className={`fr-icon-information-fill ${styles.icon}`} aria-hidden="true" />
          <span>
            <strong>Mise à jour rentrée 2026</strong> Vous pouvez dès à présent demander des collaborations avec les
            Missions Locales de votre territoire ! Les fonctionnalités de l&apos;ancienne version ne sont plus
            disponibles.{" "}
            <Link href="/cfa/a-propos" className={styles.link}>
              En savoir plus ici →
            </Link>
          </span>
        </p>
        <DismissButton onDismiss={dismiss} label="Fermer le bandeau de mise à jour" />
      </div>
    </div>
  );
}
