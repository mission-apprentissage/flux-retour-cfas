"use client";

import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import type { IClassifierStats } from "shared/models/data/nationalStats.model";

import { CLASSIFIER_FEEDBACK_COLORS } from "../constants";
import { Skeleton } from "../ui/Skeleton";

import { ChartLegend } from "./ChartLegend";
import { ItemChartTooltip } from "./ChartTooltip";
import styles from "./WhatsAppPieChart.module.css";

interface ClassifierFeedbackChartsProps {
  data?: IClassifierStats["feedback"];
  loading?: boolean;
}

export function ClassifierFeedbackCharts({ data, loading }: ClassifierFeedbackChartsProps) {
  if (loading || !data) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "32px" }}>
        <Skeleton height="300px" width="100%" />
        <Skeleton height="300px" width="100%" />
        <Skeleton height="300px" width="100%" />
      </div>
    );
  }

  const reactiviteData = [
    { id: "oui", value: data.meilleure_reactivite.oui, label: "Oui", color: CLASSIFIER_FEEDBACK_COLORS.oui },
    { id: "non", value: data.meilleure_reactivite.non, label: "Non", color: CLASSIFIER_FEEDBACK_COLORS.non },
  ].filter((d) => d.value > 0);

  const reactiviteTotal = data.meilleure_reactivite.oui + data.meilleure_reactivite.non;

  const scaleLabels = ["0", "1", "2", "3", "4", "5"];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "32px" }}>
      <div className={styles.container}>
        <h3 className={styles.title}>Meilleure réactivité constatée</h3>
        <div className={styles.chartSection}>
          <PieChart
            series={[
              {
                data: reactiviteData,
                highlightScope: { highlight: "item" },
                valueFormatter: (item) => {
                  const pct = reactiviteTotal > 0 ? Math.round((item.value / reactiviteTotal) * 100) : 0;
                  return `${item.value} (${pct}%)`;
                },
              },
            ]}
            height={200}
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            slots={{ legend: () => null, tooltip: ItemChartTooltip }}
            sx={{ width: "100%", maxWidth: "200px" }}
          />
        </div>
        <div className={styles.legendSection}>
          <ChartLegend
            items={[
              { label: "Oui", color: CLASSIFIER_FEEDBACK_COLORS.oui, value: data.meilleure_reactivite.oui },
              { label: "Non", color: CLASSIFIER_FEEDBACK_COLORS.non, value: data.meilleure_reactivite.non },
            ]}
          />
        </div>
      </div>

      <div className={styles.container}>
        <h3 className={styles.title}>Confiance dans l&apos;indice (moy: {data.confiance_indice.moyenne})</h3>
        <BarChart
          xAxis={[{ data: scaleLabels, scaleType: "band" }]}
          series={[{ data: data.confiance_indice.distribution, color: "#6A6AF4" }]}
          height={250}
          margin={{ top: 10, right: 10, bottom: 30, left: 40 }}
          slots={{ legend: () => null }}
        />
      </div>

      <div className={styles.container}>
        <h3 className={styles.title}>Utilité de l&apos;indice (moy: {data.utilite_indice.moyenne})</h3>
        <BarChart
          xAxis={[{ data: scaleLabels, scaleType: "band" }]}
          series={[{ data: data.utilite_indice.distribution, color: "#6A6AF4" }]}
          height={250}
          margin={{ top: 10, right: 10, bottom: 30, left: 40 }}
          slots={{ legend: () => null }}
        />
      </div>
    </div>
  );
}
