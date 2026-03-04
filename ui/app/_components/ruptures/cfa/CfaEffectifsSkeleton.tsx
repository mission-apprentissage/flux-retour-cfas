"use client";

import { Skeleton } from "@mui/material";

import styles from "./CfaDashboardSkeleton.module.css";

export function CfaEffectifsSkeleton() {
  return (
    <div className="fr-container">
      <div className={styles.header}>
        <Skeleton animation="wave" variant="rectangular" width={400} height={36} sx={{ mb: 1 }} />
        <Skeleton animation="wave" variant="rectangular" width={500} height={20} />
      </div>

      <div className={styles.filters}>
        <Skeleton animation="wave" variant="rectangular" width={500} height={40} sx={{ mb: 1, borderRadius: "4px" }} />
        <div className={styles.filtersRow}>
          <Skeleton animation="wave" variant="rectangular" width={200} height={40} sx={{ borderRadius: "4px" }} />
          <Skeleton animation="wave" variant="rectangular" width={320} height={40} sx={{ borderRadius: "4px" }} />
          <Skeleton animation="wave" variant="rectangular" width={320} height={40} sx={{ borderRadius: "4px" }} />
        </div>
      </div>

      <div style={{ width: "100%" }}>
        <Skeleton animation="wave" variant="rectangular" width="100%" height={44} sx={{ mb: 0.5 }} />
        {[...Array(10)].map((_, i) => (
          <Skeleton animation="wave" key={i} variant="rectangular" width="100%" height={52} sx={{ mb: 0.5 }} />
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: "1.5rem" }}>
        <Skeleton animation="wave" variant="rectangular" width={300} height={40} sx={{ borderRadius: "4px" }} />
      </div>
    </div>
  );
}
