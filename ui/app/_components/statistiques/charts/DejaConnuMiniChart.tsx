"use client";

import { Skeleton } from "@/app/_components/common/Skeleton";

import styles from "./DejaConnuMiniChart.module.css";
import { DonutChart } from "./DonutChart";

interface DejaConnuMiniChartProps {
  dejaConnu: number;
  total: number;
  loading?: boolean;
}

export function DejaConnuMiniChart({ dejaConnu, total, loading }: DejaConnuMiniChartProps) {
  if (loading) {
    return (
      <div className={styles.section}>
        <Skeleton height="50px" width="100%" />
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.chart}>
        <DonutChart
          data={[
            { id: "connu", value: dejaConnu, label: "Connus", color: "#6A6AF4" },
            { id: "inconnu", value: total - dejaConnu, label: "Non connus", color: "#FFFFFF" },
          ]}
          height={50}
          maxWidth={50}
          outerRadius={20}
          margin={0}
          valueFormatter={(item) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return `${item.value.toLocaleString("fr-FR")} (${pct}%)`;
          }}
        />
      </div>
      <span className={styles.label}>Part des jeunes déjà connus par les Missions Locales</span>
      <span className={styles.value}>
        <strong>{dejaConnu.toLocaleString("fr-FR")}</strong> sur {total.toLocaleString("fr-FR")}
      </span>
    </div>
  );
}
