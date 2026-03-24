"use client";

import { PieChart } from "@mui/x-charts/PieChart";
import type { IClassifierStats } from "shared/models/data/nationalStats.model";

import { CLASSIFIER_SITUATION_COLORS, CLASSIFIER_SITUATION_LABELS } from "../constants";
import { Skeleton } from "../ui/Skeleton";

import { ChartLegend } from "./ChartLegend";
import { ItemChartTooltip } from "./ChartTooltip";
import styles from "./WhatsAppPieChart.module.css";

type SituationData = IClassifierStats["situations"]["contact_opportun"];

const SITUATION_KEYS = [
  "rdv_pris",
  "nouveau_projet",
  "deja_accompagne",
  "contacte_sans_retour",
  "coordonnees_incorrect",
  "injoignable_apres_relances",
  "autre",
] as const;

function buildPieData(data: SituationData) {
  return SITUATION_KEYS.map((key) => ({
    id: key,
    value: data[key],
    label: CLASSIFIER_SITUATION_LABELS[key],
    color: CLASSIFIER_SITUATION_COLORS[key],
  })).filter((d) => d.value > 0);
}

interface ClassifierSituationsPieChartProps {
  data?: IClassifierStats["situations"];
  loading?: boolean;
}

export function ClassifierSituationsPieChart({ data, loading }: ClassifierSituationsPieChartProps) {
  if (loading || !data) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
        <Skeleton height="300px" width="100%" />
        <Skeleton height="300px" width="100%" />
      </div>
    );
  }

  const coData = buildPieData(data.contact_opportun);

  return (
    <SituationChart title="Situations des contacts opportuns" pieData={coData} total={data.contact_opportun.total} />
  );
}

function SituationChart({
  title,
  pieData,
  total,
}: {
  title: string;
  pieData: Array<{ id: string; value: number; label: string; color: string }>;
  total: number;
}) {
  return (
    <div className={styles.container}>
      {title && <h3 className={styles.title}>{title}</h3>}
      <div className={styles.chartSection}>
        <PieChart
          series={[
            {
              data: pieData,
              highlightScope: { highlight: "item" },
              valueFormatter: (item) => {
                const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                return `${item.value.toLocaleString("fr-FR")} (${pct}%)`;
              },
            },
          ]}
          height={250}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          slots={{ legend: () => null, tooltip: ItemChartTooltip }}
          sx={{ width: "100%", maxWidth: "250px" }}
        />
      </div>
      <div className={styles.legendSection}>
        <ChartLegend
          items={SITUATION_KEYS.map((key) => ({
            label: CLASSIFIER_SITUATION_LABELS[key],
            color: CLASSIFIER_SITUATION_COLORS[key],
            value: pieData.find((d) => d.id === key)?.value || 0,
          }))}
        />
      </div>
      <div className={styles.totalSection}>
        <div className={styles.totalContent}>
          <span className={styles.totalLabel}>Total</span>
          <span className={styles.totalValue}>{total.toLocaleString("fr-FR")}</span>
        </div>
      </div>
    </div>
  );
}
