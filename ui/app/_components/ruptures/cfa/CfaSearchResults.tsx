"use client";

import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { Skeleton } from "@mui/material";

import type { ICfaEffectif, ICfaEffectifsResponse } from "@/common/types/cfaRuptures";

import cardStyles from "./CfaCardSection.module.css";
import { CfaEffectifsTable } from "./CfaEffectifsTable";
import styles from "./CfaSearchResults.module.css";

interface CfaSearchResultsProps {
  data: ICfaEffectifsResponse | undefined;
  isLoading: boolean;
  sort: string;
  order: "asc" | "desc";
  onSort: (sortKey: string) => void;
  onToggleRupture: (effectif: ICfaEffectif) => void;
  onPageChange: (page: number) => void;
}

export function CfaSearchResults({
  data,
  isLoading,
  sort,
  order,
  onSort,
  onToggleRupture,
  onPageChange,
}: CfaSearchResultsProps) {
  if (isLoading) {
    return (
      <section className={`${cardStyles.card} ${styles.section}`}>
        <div className={cardStyles.cardHeader}>
          <Skeleton animation="wave" variant="rectangular" width={280} height={32} />
          <Skeleton animation="wave" variant="rectangular" width={100} height={24} />
        </div>
        <Skeleton animation="wave" variant="rectangular" width="100%" height={44} sx={{ mb: 0.5 }} />
        {[...Array(5)].map((_, i) => (
          <Skeleton animation="wave" key={i} variant="rectangular" width="100%" height={52} sx={{ mb: 0.5 }} />
        ))}
      </section>
    );
  }

  if (!data || data.effectifs.length === 0) {
    return (
      <section className={`${cardStyles.card} ${styles.section}`}>
        <p className={styles.loadingText}>Aucun effectif trouvé.</p>
      </section>
    );
  }

  return (
    <section className={`${cardStyles.card} ${styles.section}`}>
      <div className={cardStyles.cardHeader}>
        <h3 className={cardStyles.cardTitle}>Résultats de recherche</h3>
        <span className={cardStyles.cardCount}>
          {data.pagination.total} effectif{data.pagination.total !== 1 ? "s" : ""}
        </span>
      </div>

      <CfaEffectifsTable
        effectifs={data.effectifs}
        sort={sort}
        order={order}
        onSort={onSort}
        onToggleRupture={onToggleRupture}
        showNonRuptureAlerts
      />

      {data.pagination.totalPages > 1 && (
        <div className={cardStyles.paginationContainer}>
          <Pagination
            key={data.pagination.page}
            count={data.pagination.totalPages}
            defaultPage={data.pagination.page}
            getPageLinkProps={(pageNumber) => ({
              href: `#page-${pageNumber}`,
              onClick: (e: React.MouseEvent) => {
                e.preventDefault();
                onPageChange(pageNumber);
              },
            })}
            showFirstLast
          />
        </div>
      )}
    </section>
  );
}
