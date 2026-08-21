"use client";

import { IEffectifMissionLocale } from "shared";

import styles from "./CollaborationDetail.shared.module.css";

interface ResponsableLegalBlockProps {
  organismeData: IEffectifMissionLocale["effectif"]["organisme_data"];
}

export function ResponsableLegalBlock({ organismeData }: ResponsableLegalBlockProps) {
  const responsable = organismeData?.verified_info?.responsable_legal;
  if (!responsable) return null;

  const coordonnees = [responsable.nom, responsable.telephone, responsable.courriel].filter(Boolean).join(", ");
  if (!coordonnees) return null;

  return (
    <div className={styles.sentBubbleSection}>
      <p className={styles.sentSectionTitle}>Coordonnées des responsables légaux</p>
      <p className={styles.sentBody}>{coordonnees}</p>
    </div>
  );
}
