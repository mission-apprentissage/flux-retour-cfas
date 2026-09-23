"use client";

import { Skeleton } from "@/app/_components/common/Skeleton";

import styles from "./OnboardingSkeleton.module.css";

const SIDEBAR_BAR_WIDTHS = [120, 200, 160, 140];
const MAIN_BAR_WIDTHS: Array<number | string> = [300, 250, "100%", "100%", 200];

// Reprend la silhouette flex (sidebar + main) d'`OnboardingLayout` pour éviter
// le saut visuel quand les données arrivent.
export function OnboardingSkeleton() {
  return (
    <div className={styles.layout}>
      <div className={styles.sidebar}>
        {SIDEBAR_BAR_WIDTHS.map((w, i) => (
          <Skeleton key={i} width={w} height={16} className="fr-mb-2w" />
        ))}
      </div>
      <div className={styles.main}>
        <Skeleton width="70%" height={36} className="fr-mb-4w" />
        {MAIN_BAR_WIDTHS.map((w, i) => (
          <Skeleton key={i} width={w} height={44} className="fr-mb-2w" />
        ))}
      </div>
    </div>
  );
}
