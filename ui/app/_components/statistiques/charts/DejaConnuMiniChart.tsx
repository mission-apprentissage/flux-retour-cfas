"use client";

import { PieChart } from "@mui/x-charts/PieChart";

import { Skeleton } from "../ui/Skeleton";

import { ItemChartTooltip } from "./ChartTooltip";
import styles from "./DejaConnuMiniChart.module.css";

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
        <PieChart
          series={[
            {
              data: [
                { id: "connu", value: dejaConnu, label: "Connus", color: "#6A6AF4" },
                { id: "inconnu", value: total - dejaConnu, label: "Non connus", color: "#FFFFFF" },
              ],
              innerRadius: 0,
              outerRadius: 20,
            },
          ]}
          height={50}
          width={50}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          slots={{ legend: () => null, tooltip: ItemChartTooltip }}
        />
      </div>
      <span className={styles.label}>Part des jeunes déjà connus par les Missions Locales</span>
      <span className={styles.value}>
        <strong>{dejaConnu.toLocaleString("fr-FR")}</strong> sur {total.toLocaleString("fr-FR")}
      </span>
    </div>
  );
}
