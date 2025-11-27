"use client";

import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";

import styles from "./common.module.css";

interface SortableTableHeaderProps<T extends string> {
  column: T;
  label: string;
  currentSortColumn: T;
  sortDirection: "asc" | "desc";
  onSort: (column: T) => void;
  centered?: boolean;
  tooltip?: string;
}

export function SortableTableHeader<T extends string>({
  column,
  label,
  currentSortColumn,
  sortDirection,
  onSort,
  centered,
  tooltip,
}: SortableTableHeaderProps<T>) {
  const isSorted = currentSortColumn === column;
  const iconClass = sortDirection === "desc" ? "ri-arrow-down-line" : "ri-arrow-up-line";

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSort(column);
    }
  };

  const ariaLabel = `Trier par ${label}${isSorted ? `, actuellement trié par ordre ${sortDirection === "asc" ? "croissant" : "décroissant"}` : ""}`;

  const sortContent = (
    <>
      {label}
      {isSorted && <i className={`${iconClass} ${styles.sortIcon}`} aria-hidden="true" />}
    </>
  );

  if (tooltip) {
    return (
      <div className={centered ? styles.sortableHeaderCentered : styles.sortableHeader}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSort(column)}
          onKeyDown={handleKeyDown}
          className={styles.sortableContent}
          aria-label={ariaLabel}
        >
          {sortContent}
        </div>
        <Tooltip kind="hover" title={tooltip} />
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSort(column)}
      onKeyDown={handleKeyDown}
      className={centered ? styles.sortableHeaderCentered : styles.sortableHeader}
      aria-label={ariaLabel}
    >
      {sortContent}
    </div>
  );
}
