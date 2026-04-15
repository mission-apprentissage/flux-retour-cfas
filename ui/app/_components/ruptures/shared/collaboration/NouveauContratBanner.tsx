"use client";

import { IEffectifMissionLocale } from "shared";

import { EffectifStatusBadge } from "@/app/_components/ruptures/shared/ui/EffectifStatusBadge";
import { formatDate } from "@/app/_utils/date.utils";

import styles from "./CollaborationDetail.shared.module.css";

interface NouveauContratBannerProps {
  effectif: IEffectifMissionLocale["effectif"];
}

export function NouveauContratBanner({ effectif }: NouveauContratBannerProps) {
  if (!effectif.nouveau_contrat) return null;

  return (
    <div className={styles.nouveauContratBanner}>
      <div className={styles.nouveauContratBannerTag}>
        <EffectifStatusBadge effectif={effectif} />
      </div>
      <div className={styles.nouveauContratBannerContent}>
        <div className={styles.nouveauContratBannerRow}>
          <span
            className={`fr-icon-file-text-line fr-icon--sm ${styles.nouveauContratBannerIcon}`}
            aria-hidden="true"
          />
          <span className={styles.nouveauContratBannerTitle}>Nouveau contrat signé</span>
        </div>
        {effectif.current_status?.date && (
          <span className={styles.nouveauContratBannerDate}>{formatDate(effectif.current_status.date)}</span>
        )}
      </div>
      {effectif.transmitted_at && (
        <p className={styles.nouveauContratBannerSubtext}>
          Donnée transmise par l&apos;ERP du CFA le {formatDate(effectif.transmitted_at)}
        </p>
      )}
    </div>
  );
}
