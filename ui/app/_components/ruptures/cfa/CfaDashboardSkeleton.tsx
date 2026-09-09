"use client";

import { Skeleton } from "@/app/_components/common/Skeleton";

import styles from "./CfaDashboardSkeleton.module.css";

function SegmentSkeleton({ rows }: { rows: number }) {
  return (
    <div className={styles.segment}>
      <div className={styles.segmentHeader}>
        <Skeleton width={180} height={32} />
        <Skeleton width={100} height={24} />
      </div>
      <div>
        <Skeleton height={44} className="fr-mb-1v" />
        {[...Array(rows)].map((_, i) => (
          <Skeleton key={i} height={52} className="fr-mb-1v" />
        ))}
      </div>
    </div>
  );
}

export function CfaDashboardSkeleton() {
  return (
    <div className="fr-container">
      <div className={styles.header}>
        <Skeleton width={500} height={36} className="fr-mb-1w" />
        <Skeleton width={600} height={20} />
      </div>

      <div className={styles.filters}>
        <Skeleton width={500} height={40} className="fr-mb-1w" />
        <div className={styles.filtersRow}>
          <Skeleton width={320} height={40} />
          <Skeleton width={320} height={40} />
        </div>
      </div>

      <SegmentSkeleton rows={5} />
      <SegmentSkeleton rows={3} />
      <SegmentSkeleton rows={2} />
    </div>
  );
}
