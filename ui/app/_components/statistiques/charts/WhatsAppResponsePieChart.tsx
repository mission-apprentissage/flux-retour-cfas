"use client";

import { PieChart } from "@mui/x-charts/PieChart";
import type { IWhatsAppStats } from "shared/models/data/nationalStats.model";

import { WHATSAPP_RESPONSE_COLORS, WHATSAPP_RESPONSE_LABELS } from "../constants";
import { Skeleton } from "../ui/Skeleton";

import { ChartLegend } from "./ChartLegend";
import { ItemChartTooltip } from "./ChartTooltip";
import styles from "./WhatsAppPieChart.module.css";

interface WhatsAppResponsePieChartProps {
  data?: IWhatsAppStats["responseDistribution"];
  loading?: boolean;
}

export function WhatsAppResponsePieChart({ data, loading }: WhatsAppResponsePieChartProps) {
  if (loading || !data) {
    return (
      <div className={styles.container}>
        <Skeleton height="280px" width="100%" />
      </div>
    );
  }

  const entries = [
    {
      id: "callback",
      value: data.callback,
      label: WHATSAPP_RESPONSE_LABELS.callback,
      color: WHATSAPP_RESPONSE_COLORS.callback,
    },
    {
      id: "no_help",
      value: data.no_help,
      label: WHATSAPP_RESPONSE_LABELS.no_help,
      color: WHATSAPP_RESPONSE_COLORS.no_help,
    },
    {
      id: "no_response",
      value: data.no_response,
      label: WHATSAPP_RESPONSE_LABELS.no_response,
      color: WHATSAPP_RESPONSE_COLORS.no_response,
    },
    {
      id: "opted_out",
      value: data.opted_out,
      label: WHATSAPP_RESPONSE_LABELS.opted_out,
      color: WHATSAPP_RESPONSE_COLORS.opted_out,
    },
  ] as const;

  const pieData = entries.filter((item) => item.value > 0);
  const total = data.callback + data.no_help + data.no_response + data.opted_out;

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Distribution des réponses</h3>
      <div className={styles.chartSection}>
        <PieChart
          series={[{ data: pieData, highlightScope: { highlight: "item" } }]}
          height={280}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          slots={{ legend: () => null, tooltip: ItemChartTooltip }}
          sx={{ width: "100%", maxWidth: "280px", "& .MuiChartsLegend-root": { display: "none" } }}
        />
      </div>
      <div className={styles.legendSection}>
        <ChartLegend
          items={entries.map((item) => ({
            label: item.label,
            color: item.color,
            value: item.value,
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
