"use client";

import { Skeleton } from "@/app/_components/common/Skeleton";

import styles from "./LoadingSkeletons.module.css";

export function TableSkeleton() {
  return (
    <div className={styles.table}>
      <Skeleton width="40%" height={28} className="fr-mb-2w" />
      <Skeleton height={52} className="fr-mb-1w" />
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} height={52} className="fr-mb-1w" />
      ))}
    </div>
  );
}

export function ContentSkeleton() {
  return (
    <div className="fr-container">
      <Skeleton width="40%" height={32} className="fr-mb-3w" />
      <Skeleton height={56} className={styles.field} />
      <Skeleton width={160} height={40} />
    </div>
  );
}

export function PageWithSidebarSkeleton() {
  return (
    <div className="fr-grid-row fr-grid-row--gutters">
      <div className="fr-col-12 fr-col-md-3">
        <Skeleton height={400} />
      </div>
      <div className="fr-col-12 fr-col-md-9">
        <div className={styles.stack}>
          <Skeleton height={60} />
          <Skeleton height={200} />
          <Skeleton height={300} />
        </div>
      </div>
    </div>
  );
}
