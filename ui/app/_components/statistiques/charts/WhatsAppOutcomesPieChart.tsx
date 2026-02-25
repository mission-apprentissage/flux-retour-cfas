"use client";

import { PieChart } from "@mui/x-charts/PieChart";
import type { IWhatsAppStats } from "shared/models/data/nationalStats.model";

import { WHATSAPP_OUTCOMES_COLORS, WHATSAPP_OUTCOMES_LABELS } from "../constants";
import { Skeleton } from "../ui/Skeleton";

import { ChartLegend } from "./ChartLegend";
import { ItemChartTooltip } from "./ChartTooltip";
import styles from "./WhatsAppPieChart.module.css";

interface WhatsAppOutcomesPieChartProps {
  data?: IWhatsAppStats["callbackOutcomes"];
  loading?: boolean;
}

const OUTCOME_KEYS = [
  "rdv_pris",
  "nouveau_projet",
  "deja_accompagne",
  "injoignable",
  "coordonnees_incorrect",
  "autre",
  "en_attente",
] as const;

export function WhatsAppOutcomesPieChart({ data, loading }: WhatsAppOutcomesPieChartProps) {
  if (loading || !data) {
    return (
      <div className={styles.container}>
        <Skeleton height="280px" width="100%" />
      </div>
    );
  }

  const entries = OUTCOME_KEYS.map((key) => ({
    id: key,
    value: data[key],
    label: WHATSAPP_OUTCOMES_LABELS[key],
    color: WHATSAPP_OUTCOMES_COLORS[key],
  }));

  const pieData = entries.filter((item) => item.value > 0);
  const total = entries.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Suivi après demande de rappel</h3>
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
          height={280}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          slots={{ legend: () => null, tooltip: ItemChartTooltip }}
          sx={{ width: "100%", maxWidth: "280px", "& .MuiChartsLegend-root": { display: "none" } }}
        />
      </div>
      <div className={styles.legendSection}>
        <ChartLegend
          items={pieData.map((item) => ({
            label: item.label,
            color: item.color,
            value: item.value,
          }))}
        />
      </div>
      <div className={styles.totalSection}>
        <div className={styles.totalContent}>
          <span className={styles.totalLabel}>Total demandes de rappel</span>
          <span className={styles.totalValue}>{total.toLocaleString("fr-FR")}</span>
        </div>
      </div>
    </div>
  );
}
