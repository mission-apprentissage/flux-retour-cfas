"use client";

import type { ICollabSituations } from "shared/models/data/nationalStats.model";

import { Skeleton } from "@/app/_components/common/Skeleton";

import { SITUATIONS_COLLAB } from "../constants";

import { ChartLegend } from "./ChartLegend";
import { DonutChart } from "./DonutChart";
import styles from "./SituationsPieChart.module.css";

interface SituationsPieChartProps {
  data?: ICollabSituations;
  loading?: boolean;
}

export function SituationsPieChart({ data, loading }: SituationsPieChartProps) {
  if (loading || !data) {
    return <Skeleton height="250px" width="100%" />;
  }

  const total = data.total;
  const items = SITUATIONS_COLLAB.map((situation) => ({
    id: situation.key,
    value: data[situation.key],
    label: situation.sublabel ? `${situation.label} — ${situation.sublabel.toLowerCase()}` : situation.label,
    color: situation.color,
  }));

  return (
    <div className={styles.container}>
      <div className={styles.chartWrapper}>
        <DonutChart
          data={items}
          height={220}
          maxWidth={220}
          margin={5}
          valueFormatter={(item) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return `${item.value.toLocaleString("fr-FR")} (${pct}%)`;
          }}
        />
      </div>
      <div className={styles.legend}>
        <ChartLegend
          items={SITUATIONS_COLLAB.map((situation) => ({
            label: situation.label,
            sublabel: situation.sublabel,
            color: situation.color,
            value: data[situation.key],
          }))}
        />
        <div className={styles.total}>
          <span>Total dossiers de collaboration</span>
          <strong>{total.toLocaleString("fr-FR")}</strong>
        </div>
      </div>
    </div>
  );
}
