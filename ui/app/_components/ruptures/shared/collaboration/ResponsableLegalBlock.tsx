"use client";

import { IEffectifMissionLocale } from "shared";

import { isMineur } from "@/app/_utils/ruptures.utils";

import styles from "./CollaborationDetail.shared.module.css";

interface ResponsableLegalBlockProps {
  organismeData: IEffectifMissionLocale["effectif"]["organisme_data"];
  /** Les dossiers antérieurs au filtrage serveur peuvent porter un responsable légal sur un majeur. */
  dateDeNaissance?: Date | string | null;
}

export function ResponsableLegalBlock({ organismeData, dateDeNaissance }: ResponsableLegalBlockProps) {
  const responsable = organismeData?.verified_info?.responsable_legal;
  if (!responsable || (dateDeNaissance && !isMineur(dateDeNaissance))) return null;

  const coordonnees = [responsable.nom, responsable.telephone, responsable.courriel].filter(Boolean).join(", ");
  if (!coordonnees) return null;

  return (
    <div className={styles.sentBubbleSection}>
      <p className={styles.sentSectionTitle}>Coordonnées responsables légaux</p>
      <p className={styles.sentBody}>{coordonnees}</p>
    </div>
  );
}
