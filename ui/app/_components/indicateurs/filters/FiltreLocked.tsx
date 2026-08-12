"use client";

import styles from "../indicateurs.module.scss";

export function FiltreLocked({ value }: { value: string }) {
  return (
    <p className={styles.lockedFilter}>
      <span>{value}</span>
      <i className="fr-icon-lock-line fr-icon--sm" aria-hidden="true" />
    </p>
  );
}
