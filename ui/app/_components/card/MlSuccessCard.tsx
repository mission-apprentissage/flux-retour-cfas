import Image from "next/image";
import React from "react";

import { SelectedSection } from "../mission-locale/types";

import styles from "./MlSuccessCard.module.css";

export const MlSuccessCard = ({
  handleSectionChange,
}: {
  handleSectionChange?: (section: SelectedSection) => void;
}) => {
  return (
    <div className={styles.mlSuccessCardContainer}>
      <Image
        src="/images/mission-locale-valid-tick.svg"
        alt=""
        width={50}
        height={50}
        className={styles.mlSuccessCardImage}
      />

      <div>
        <p className={`fr-text--bold ${styles.mlSuccessCardTitle}`}>
          Tous les jeunes en rupture ce mois-ci ont été contacté !
        </p>
        <p className={`fr-text--sm ${styles.mlSuccessCardText}`}>
          Retrouvez-les dans la liste{" "}
          <button
            type="button"
            className={`fr-link ${styles.mlSuccessCardLink}`}
            onClick={() => handleSectionChange?.("deja-traite")}
          >
            des dossiers déjà traités →
          </button>
        </p>
      </div>
    </div>
  );
};
