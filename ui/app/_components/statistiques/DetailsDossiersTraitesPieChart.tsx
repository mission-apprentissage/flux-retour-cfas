"use client";

import { PieChart } from "@mui/x-charts/PieChart";
import { IDetailsDossiersTraites } from "shared/models/data/nationalStats.model";

import { ItemChartTooltip } from "./ChartTooltip";
import { DOSSIERS_TRAITES_COLORS, DOSSIERS_TRAITES_LABELS, getVariationColorFromString } from "./constants";
import styles from "./DetailsDossiersTraitesPieChart.module.css";
import { Skeleton } from "./Skeleton";

interface DetailsDossiersTraitesPieChartProps {
  data: IDetailsDossiersTraites;
  loading?: boolean;
}

export function DetailsDossiersTraitesPieChart({ data, loading }: DetailsDossiersTraitesPieChartProps) {
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
                  <span className={styles.variation} style={{ color: getVariationColorFromString(variation) }}>
                    {variation}
                  </span>
                  <span className={styles.value}>{item.value.toLocaleString("fr-FR")}</span>
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

      <div className={styles.knownYoungSection}>
        <div className={styles.miniChartWrapper}>
          <PieChart
            series={[
              {
                data: [
                  {
                    id: "connu",
                    value: data.deja_connu,
                    label: "Connus",
                    color: "#6A6AF4",
                  },
                  {
                    id: "inconnu",
                    value: data.total - data.deja_connu,
                    label: "Non connus",
                    color: "#FFFFFF",
                  },
                ],
                innerRadius: 0,
                outerRadius: 20,
              },
            ]}
            height={50}
            width={50}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            slots={{
              legend: () => null,
              tooltip: ItemChartTooltip,
            }}
            sx={{
              "& .MuiChartsLegend-root": {
                display: "none",
              },
            }}
          />
        </div>
        <span className={styles.knownYoungLabel}>Part des jeunes déjà connus par les Missions locales</span>
        <span className={styles.knownYoungValue}>
          <strong>{data.deja_connu.toLocaleString("fr-FR")}</strong> sur {data.total.toLocaleString("fr-FR")}
        </span>
      </div>
    </div>
  );
}
