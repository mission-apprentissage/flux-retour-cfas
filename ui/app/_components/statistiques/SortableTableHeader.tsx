"use client";

import styles from "./TraitementTable.module.css";

interface SortableTableHeaderProps<T extends string> {
  column: T;
  label: string;
  currentSortColumn: T;
  sortDirection: "asc" | "desc";
  onSort: (column: T) => void;
  centered?: boolean;
}

export function SortableTableHeader<T extends string>({
  column,
  label,
  currentSortColumn,
  sortDirection,
  onSort,
  centered,
}: SortableTableHeaderProps<T>) {
  const isSorted = currentSortColumn === column;
  const iconClass = sortDirection === "desc" ? "ri-arrow-down-line" : "ri-arrow-up-line";

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSort(column);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSort(column)}
      onKeyDown={handleKeyDown}
      className={centered ? styles.sortableHeaderCentered : styles.sortableHeader}
      aria-label={`Trier par ${label}${isSorted ? `, actuellement trié par ordre ${sortDirection === "asc" ? "croissant" : "décroissant"}` : ""}`}
    >
      {label}
      {isSorted && <i className={`${iconClass} ${styles.sortIcon}`} aria-hidden="true" />}
    </div>
  );
}
