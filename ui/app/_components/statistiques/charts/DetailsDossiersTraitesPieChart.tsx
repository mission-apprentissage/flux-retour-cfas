"use client";

import { PieChart } from "@mui/x-charts/PieChart";
import { IDetailsDossiersTraites } from "shared/models/data/nationalStats.model";

import { DOSSIERS_TRAITES_COLORS, DOSSIERS_TRAITES_LABELS, getVariationColorFromString } from "../constants";
import { Skeleton } from "../ui/Skeleton";

import { ItemChartTooltip } from "./ChartTooltip";
import { DejaConnuMiniChart } from "./DejaConnuMiniChart";
import styles from "./DetailsDossiersTraitesPieChart.module.css";

interface DetailsDossiersTraitesPieChartProps {
  data?: IDetailsDossiersTraites;
  loading?: boolean;
  loadingVariation?: boolean;
}

export function DetailsDossiersTraitesPieChart({
  data,
  loading,
  loadingVariation,
}: DetailsDossiersTraitesPieChartProps) {
  if (loading || !data) {
    return (
      <div className={styles.container}>
        <Skeleton height="250px" width="100%" />
      </div>
    );
  }

  type StatusId = keyof typeof DOSSIERS_TRAITES_COLORS;

  const getCurrentValue = (value: number | { current: number; variation: string }): number => {
    return typeof value === "object" ? value.current : value;
  };

  const pieData: Array<{
    id: StatusId;
    value: number;
    label: string;
    color: string;
  }> = (Object.keys(DOSSIERS_TRAITES_COLORS) as StatusId[]).map((id) => {
    const statusData = data[id];
    return {
      id,
      value: getCurrentValue(statusData),
      label: DOSSIERS_TRAITES_LABELS[id],
      color: DOSSIERS_TRAITES_COLORS[id],
    };
  });

  return (
    <div className={styles.container}>
      <p className={styles.subtitle}>Survolez chaque motif pour voir sa définition et sa représentation</p>

      <div className={styles.content}>
        <div className={styles.chartWrapper}>
          <PieChart
            series={[
              {
                data: pieData,
                highlightScope: { highlight: "item" },
                valueFormatter: (item) => {
                  const pct = data.total > 0 ? Math.round((item.value / data.total) * 100) : 0;
                  return `${item.value.toLocaleString("fr-FR")} (${pct}%)`;
                },
              },
            ]}
            height={250}
            margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
            slots={{
              legend: () => null,
              tooltip: ItemChartTooltip,
            }}
            sx={{
              width: "100%",
              maxWidth: "250px",
              "& .MuiChartsLegend-root": {
                display: "none",
              },
            }}
          />
        </div>

        <div className={styles.legend}>
          {pieData.map((item) => {
            const statusData = data[item.id];
            const variation = typeof statusData === "object" && "variation" in statusData ? statusData.variation : "0%";

            return (
              <div key={item.id} className={styles.legendItem}>
                <div className={styles.legendLeftContent}>
                  <div className={styles.legendDot} style={{ backgroundColor: item.color }} />
                  <span className={styles.legendLabel}>{item.label}</span>
                </div>
                <div className={styles.legendRightContent}>
                  <span className={styles.value}>{item.value.toLocaleString("fr-FR")}</span>
                  {loadingVariation ? (
                    <Skeleton width="40px" height="16px" />
                  ) : (
                    <span className={styles.variation} style={{ color: getVariationColorFromString(variation) }}>
                      {variation}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          <div className={styles.separator} />

          <div className={styles.legendItem}>
            <span className={styles.legendLabel}>Total dossiers traités</span>
            <span className={styles.value}>{data.total.toLocaleString("fr-FR")}</span>
          </div>
        </div>
      </div>

      <DejaConnuMiniChart dejaConnu={data.deja_connu} total={data.total} />
    </div>
  );
}
