"use client";

import { PieChart } from "@mui/x-charts/PieChart";
import { IRupturantsSummary } from "shared/models/data/nationalStats.model";

import { getVariationColorFromString, RUPTURANTS_COLORS, RUPTURANTS_LABELS } from "../constants";
import { Skeleton } from "../ui/Skeleton";

import { ChartLegend } from "./ChartLegend";
import { ItemChartTooltip } from "./ChartTooltip";
import styles from "./RupturantsPieChart.module.css";

interface RupturantsPieChartProps {
  data?: IRupturantsSummary;
  loading?: boolean;
}

export function RupturantsPieChart({ data, loading }: RupturantsPieChartProps) {
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
        <PieChart
          series={[
            {
              data: pieData,
              highlightScope: { highlight: "item" },
            },
          ]}
          height={280}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          slots={{
            legend: () => null,
            tooltip: ItemChartTooltip,
          }}
          sx={{
            width: "100%",
            maxWidth: "280px",
            "& .MuiChartsLegend-root": {
              display: "none",
            },
          }}
        />
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
