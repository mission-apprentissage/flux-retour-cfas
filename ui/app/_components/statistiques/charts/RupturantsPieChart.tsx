"use client";

import { IRupturantsSummary } from "shared/models/data/nationalStats.model";

import { Skeleton } from "@/app/_components/common/Skeleton";

import { getVariationColorFromString, RUPTURANTS_COLORS, RUPTURANTS_LABELS } from "../constants";

import { ChartLegend } from "./ChartLegend";
import { DonutChart } from "./DonutChart";
import styles from "./RupturantsPieChart.module.css";

interface RupturantsPieChartProps {
  data?: IRupturantsSummary;
  loading?: boolean;
  loadingVariation?: boolean;
}

export function RupturantsPieChart({ data, loading, loadingVariation }: RupturantsPieChartProps) {
  if (loading || !data) {
    return (
      <div className={styles.container}>
        <Skeleton height="180px" width="100%" />
      </div>
    );
  }

  const pieData = [
    {
      id: "a_traiter",
      value: data.a_traiter.current,
      label: RUPTURANTS_LABELS.a_traiter,
      color: RUPTURANTS_COLORS.a_traiter,
    },
    {
      id: "traites",
      value: data.traites.current,
      label: RUPTURANTS_LABELS.traites,
      color: RUPTURANTS_COLORS.traites,
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.chartSection}>
        <DonutChart data={pieData} height={280} maxWidth={280} />
      </div>
      <div className={styles.legendSection}>
        <ChartLegend
          items={[
            {
              label: RUPTURANTS_LABELS.a_traiter,
              color: RUPTURANTS_COLORS.a_traiter,
              value: data.a_traiter.current,
            },
            {
              label: RUPTURANTS_LABELS.traites,
              color: RUPTURANTS_COLORS.traites,
              value: data.traites.current,
              variation: data.traites.variation,
              variationColor: getVariationColorFromString(data.traites.variation),
            },
          ]}
          loadingVariation={loadingVariation}
        />
      </div>
      <div className={styles.totalSection}>
        <div className={styles.totalContent}>
          <span className={styles.totalLabel}>Total jeunes</span>
          <span className={styles.totalValue}>{data.total.toLocaleString("fr-FR")}</span>
        </div>
      </div>
    </div>
  );
}
