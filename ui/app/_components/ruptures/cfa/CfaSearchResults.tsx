"use client";

import { Pagination } from "@codegouvfr/react-dsfr/Pagination";

import { Skeleton } from "@/app/_components/common/Skeleton";
import type { ICfaEffectif, ICfaEffectifsResponse } from "@/common/types/cfaRuptures";

import { CfaEffectifsTable } from "./CfaEffectifsTable";
import cardStyles from "./CfaRuptureSegment.module.css";
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
          <Skeleton width={280} height={32} />
          <Skeleton width={100} height={24} />
        </div>
        <Skeleton height={44} className="fr-mb-1v" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} height={52} className="fr-mb-1v" />
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
