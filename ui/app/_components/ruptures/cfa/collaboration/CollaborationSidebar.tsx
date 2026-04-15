"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { FormikErrors, useFormikContext } from "formik";
import { IEffectifMissionLocale } from "shared";

import { getInitials } from "@/app/_utils/user.utils";

import { withSharedStyles } from "../../shared/collaboration/withSharedStyles";

import cfaLocalStyles from "./CfaCollaborationDetail.module.css";
import styles from "./CollaborationForm.module.css";
import { FormValues } from "./types";

const detailStyles = withSharedStyles(cfaLocalStyles);

function countErrors(errors: FormikErrors<FormValues>): number {
  let count = 0;
  for (const value of Object.values(errors)) {
    if (typeof value === "object" && value !== null) {
      count += Object.keys(value).length;
    } else if (typeof value === "string") {
      count++;
    }
  }
  return count;
}

interface CollaborationSidebarProps {
  effectif: IEffectifMissionLocale["effectif"];
  progress: number;
  isLoading: boolean;
  hasError: boolean;
  onSubmit: () => void;
}

export function CollaborationSidebar({ effectif, progress, isLoading, hasError, onSubmit }: CollaborationSidebarProps) {
  const { errors, submitCount } = useFormikContext<FormValues>();
  const errorCount = countErrors(errors);
  const hasSubmitted = submitCount > 0;

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
        <div
          className={styles.progressBar}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progression du dossier"
        >
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <div className={styles.progressLabel}>
          <span>{progress >= 100 ? "Dossier prêt à être envoyé !" : "Dossier à compléter"}</span>
          <span className={styles.progressPercent}>{progress}%</span>
        </div>
      </div>

      {hasError && <p className={styles.sidebarError}>Une erreur est survenue. Veuillez réessayer.</p>}

      {hasSubmitted && errorCount > 0 && (
        <p className={`fr-error-text ${styles.sidebarErrorCount}`}>
          {errorCount}{" "}
          {errorCount === 1 ? "champ obligatoire n'est pas rempli" : "champs obligatoires ne sont pas remplis"}
        </p>
      )}

      <Button priority="primary" onClick={onSubmit} disabled={isLoading} className={styles.submitButton}>
        {isLoading ? "Envoi en cours..." : "Envoyer le dossier"}
      </Button>
    </aside>
  );
}
