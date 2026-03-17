"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { IEffectifMissionLocale } from "shared";

import { getInitials } from "@/app/_utils/user.utils";

import detailStyles from "./CfaCollaborationDetail.module.css";
import styles from "./CollaborationForm.module.css";

interface CollaborationSidebarProps {
  effectif: IEffectifMissionLocale["effectif"];
  progress: number;
  isValid: boolean;
  isLoading: boolean;
  hasError: boolean;
  onSubmit: () => void;
}

export function CollaborationSidebar({
  effectif,
  progress,
  isValid,
  isLoading,
  hasError,
  onSubmit,
}: CollaborationSidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <p className={styles.sidebarLabel}>Demande de collaboration Mission Locale pour</p>

      <div className={styles.sidebarStudent}>
        <div className={detailStyles.avatar}>{getInitials(effectif.nom, effectif.prenom)}</div>
        <div className={styles.sidebarStudentInfo}>
          <p className={styles.sidebarName}>
            {effectif.prenom} {effectif.nom}
          </p>
          <span className="fr-badge fr-badge--error fr-badge--sm">EN RUPTURE DE CONTRAT</span>
        </div>
      </div>

      <div className={`${styles.progressSection} ${progress >= 100 ? styles.progressComplete : ""}`}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <div className={styles.progressLabel}>
          <span>{progress >= 100 ? "Dossier prêt à être envoyé !" : "Dossier à compléter"}</span>
          <span className={styles.progressPercent}>{progress}%</span>
        </div>
      </div>

      {hasError && <p className={styles.sidebarError}>Une erreur est survenue. Veuillez réessayer.</p>}

      <Button priority="primary" onClick={onSubmit} disabled={!isValid || isLoading} className={styles.submitButton}>
        {isLoading ? "Envoi en cours..." : "Envoyer le dossier"}
      </Button>
    </aside>
  );
}
