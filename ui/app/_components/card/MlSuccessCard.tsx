import React from "react";

import styles from "./MlSuccessCard.module.css";

export const MlSuccessCard = ({ onVoirDossiersTraites }: { onVoirDossiersTraites?: () => void }) => {
  return (
    <div className={styles.mlSuccessCardContainer}>
      <i className={`fr-icon-checkbox-circle-fill ${styles.mlSuccessCardIcon}`} aria-hidden="true" />

      <div>
        <p className={`fr-text--bold ${styles.mlSuccessCardTitle}`}>
          Tous les dossiers de jeunes reçus sur ce mois ont été contactés&nbsp;!
        </p>
        <p className={styles.mlSuccessCardText}>
          Retrouvez-les dans la liste{" "}
          <button
            type="button"
            className={`fr-link fr-icon-arrow-right-line fr-link--icon-right ${styles.mlSuccessCardLink}`}
            onClick={onVoirDossiersTraites}
          >
            des dossiers déjà traités
          </button>
        </p>
      </div>
    </div>
  );
};
