"use client";

import { Skeleton } from "@/app/_components/common/Skeleton";

import styles from "./MlListeSkeleton.module.css";

/** Reprend le layout réel de la vue pour éviter le saut de mise en page au chargement. */
export function MlListeSkeleton({ nbOnglets = 1 }: { nbOnglets?: number }) {
  return (
    <div>
      <div className={styles.filters}>
        <Skeleton height={40} className={styles.search} />
        <div className={styles.filtersRow}>
          <Skeleton width={99} height={40} />
          <Skeleton width={181} height={40} />
        </div>
      </div>

      <div className={styles.tabs}>
        {[...Array(nbOnglets)].map((_, i) => (
          <Skeleton key={i} width={264} height={40} />
        ))}
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <Skeleton width="40%" height={32} />
          <Skeleton width={200} height={32} />
        </div>
        <Skeleton height={58} className="fr-mb-1w" />
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} height={84} className="fr-mb-1w" />
        ))}
      </div>
    </div>
  );
}
