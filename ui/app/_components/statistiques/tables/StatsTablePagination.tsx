"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { useId } from "react";

import styles from "./StatsTablePagination.module.css";

export const STATS_PAGE_SIZES = [10, 20, 50];
const VISIBLE_PAGES = 7;

const visiblePages = (page: number, count: number) => {
  const start = Math.max(1, Math.min(page - Math.floor(VISIBLE_PAGES / 2), count - VISIBLE_PAGES + 1));
  return Array.from({ length: Math.min(VISIBLE_PAGES, count) }, (_, index) => start + index);
};

interface StatsTablePaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  limit: number;
  onLimitChange: (limit: number) => void;
  label: string;
  className?: string;
}

/** Pagination des tableaux de stats : « Précédent 1 2 … Suivant » à gauche, « Voir par » à droite. */
export function StatsTablePagination({
  page,
  totalPages,
  onPageChange,
  limit,
  onLimitChange,
  label,
  className,
}: StatsTablePaginationProps) {
  const selectId = useId();
  const count = Math.max(totalPages, 1);
  if (count === 1 && limit <= STATS_PAGE_SIZES[0]) return null;

  const goTo = (target: number) => (event: React.MouseEvent) => {
    event.preventDefault();
    if (target >= 1 && target <= count && target !== page) onPageChange(target);
  };

  return (
    <div className={`${styles.row} ${className ?? ""}`}>
      <nav role="navigation" className={fr.cx("fr-pagination")} aria-label={`Pagination : ${label}`}>
        <ul className={fr.cx("fr-pagination__list")}>
          <li>
            <a
              className={fr.cx("fr-pagination__link", "fr-pagination__link--prev", "fr-pagination__link--lg-label")}
              {...(page > 1 ? { href: "#", onClick: goTo(page - 1) } : { "aria-disabled": true, role: "link" })}
            >
              Précédent
            </a>
          </li>
          {visiblePages(page, count).map((pageNumber) => (
            <li key={pageNumber}>
              <a
                className={fr.cx("fr-pagination__link")}
                href="#"
                onClick={goTo(pageNumber)}
                {...(pageNumber === page ? { "aria-current": "page" as const } : {})}
                title={`Page ${pageNumber}`}
              >
                {pageNumber}
              </a>
            </li>
          ))}
          <li>
            <a
              className={fr.cx("fr-pagination__link", "fr-pagination__link--next", "fr-pagination__link--lg-label")}
              {...(page < count ? { href: "#", onClick: goTo(page + 1) } : { "aria-disabled": true, role: "link" })}
            >
              Suivant
            </a>
          </li>
        </ul>
      </nav>
      <label className={fr.cx("fr-sr-only")} htmlFor={selectId}>
        Nombre de lignes par page
      </label>
      <select
        id={selectId}
        className={styles.pageSize}
        value={limit}
        onChange={(event) => {
          onLimitChange(Number(event.target.value));
          onPageChange(1);
        }}
      >
        {STATS_PAGE_SIZES.map((size) => (
          <option key={size} value={size}>
            Voir par {size}
          </option>
        ))}
      </select>
    </div>
  );
}
