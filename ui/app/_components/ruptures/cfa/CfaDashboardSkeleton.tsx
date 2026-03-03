"use client";

import { Skeleton, Box } from "@mui/material";

import styles from "./CfaDashboardSkeleton.module.css";

function SegmentSkeleton({ rows }: { rows: number }) {
  return (
    <div className={styles.segment}>
      <div className={styles.segmentHeader}>
        <Skeleton animation="wave" variant="rectangular" width={180} height={32} />
        <Skeleton animation="wave" variant="rectangular" width={100} height={24} />
      </div>
      <Box sx={{ width: "100%" }}>
        <Skeleton animation="wave" variant="rectangular" width="100%" height={44} sx={{ mb: 0.5 }} />
        {[...Array(rows)].map((_, i) => (
          <Skeleton animation="wave" key={i} variant="rectangular" width="100%" height={52} sx={{ mb: 0.5 }} />
        ))}
      </Box>
    </div>
  );
}

export function CfaDashboardSkeleton() {
  return (
    <div className="fr-container">
      <div className={styles.header}>
        <Skeleton animation="wave" variant="rectangular" width={500} height={36} sx={{ mb: 1 }} />
        <Skeleton animation="wave" variant="rectangular" width={600} height={20} />
      </div>

      <div className={styles.filters}>
        <Skeleton animation="wave" variant="rectangular" width={500} height={40} sx={{ mb: 1, borderRadius: "4px" }} />
        <div className={styles.filtersRow}>
          <Skeleton animation="wave" variant="rectangular" width={320} height={40} sx={{ borderRadius: "4px" }} />
          <Skeleton animation="wave" variant="rectangular" width={320} height={40} sx={{ borderRadius: "4px" }} />
        </div>
      </div>

      <SegmentSkeleton rows={5} />
      <SegmentSkeleton rows={3} />
      <SegmentSkeleton rows={2} />
    </div>
  );
}
