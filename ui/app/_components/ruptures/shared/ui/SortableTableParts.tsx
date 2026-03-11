"use client";

import styles from "./SortableTable.module.css";

export function SortIcon({ isSorted }: { isSorted: false | "asc" | "desc" }) {
  const iconClass = isSorted === "desc" ? "fr-icon-arrow-down-line" : "fr-icon-arrow-up-line";
  return (
    <span className={styles.sortIconWrapper}>
      <i className={`${iconClass} ${styles.sortIcon} ${isSorted ? styles.sortIconActive : styles.sortIconInactive}`} />
    </span>
  );
}

export function SortableHeader<T extends string>({
  label,
  sortKey,
  currentSort,
  currentDir,
  onSort,
  afterLabel,
}: {
  label: string;
  sortKey: T;
  currentSort: string;
  currentDir: "asc" | "desc";
  onSort: (key: T) => void;
  afterLabel?: React.ReactNode;
}) {
  return (
    <button type="button" className={styles.sortableHeader} onClick={() => onSort(sortKey)}>
      {label}
      {afterLabel}
      <SortIcon isSorted={currentSort === sortKey ? currentDir : false} />
    </button>
  );
}

export function DateRuptureCell({ dateStr, jours }: { dateStr: string; jours?: number }) {
  const date = new Date(dateStr);
  const formatted = date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const diffDays = jours ?? Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  return (
    <div className={styles.dateRuptureCell}>
      <span className={styles.dateRuptureDate}>{formatted}</span>
      <span className={styles.dateRuptureJours}>
        {diffDays === 0 ? "Aujourd'hui" : diffDays === 1 ? "Il y a 1 jour" : `Il y a ${diffDays} jours`}
      </span>
    </div>
  );
}
