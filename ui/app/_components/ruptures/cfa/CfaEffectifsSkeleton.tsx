"use client";

import { Skeleton } from "@/app/_components/common/Skeleton";

import styles from "./CfaDashboardSkeleton.module.css";

export function CfaEffectifsSkeleton() {
  return (
    <div className="fr-container">
      <div className={styles.header}>
        <Skeleton width={400} height={36} className="fr-mb-1w" />
        <Skeleton width={500} height={20} />
      </div>

      <div className={styles.filters}>
        <Skeleton width={500} height={40} className="fr-mb-1w" />
        <div className={styles.filtersRow}>
          <Skeleton width={200} height={40} />
          <Skeleton width={320} height={40} />
          <Skeleton width={320} height={40} />
        </div>
      </div>

      <div>
        <Skeleton height={44} className="fr-mb-1v" />
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} height={52} className="fr-mb-1v" />
        ))}
      </div>

      <div className={styles.pagination}>
        <Skeleton width={300} height={40} />
      </div>
    </div>
  );
}
