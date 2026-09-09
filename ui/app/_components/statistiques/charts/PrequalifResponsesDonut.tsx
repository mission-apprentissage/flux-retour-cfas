"use client";

import type { IPrequalifStats } from "shared/models/data/nationalStats.model";

import { Skeleton } from "@/app/_components/common/Skeleton";

import { ChartLegend } from "./ChartLegend";
import { DonutChart } from "./DonutChart";
import styles from "./PrequalifResponsesDonut.module.css";

const COLORS = {
  yes: "#18753C",
  no: "#CE0500",
  no_response: "#929292",
} as const;

const LABELS = {
  yes: "Ça m'intéresse",
  no: "Ne veut pas d'aide",
  no_response: "Sans réponse",
} as const;

interface Props {
  data?: IPrequalifStats["responses"];
  loading?: boolean;
}

export function PrequalifResponsesDonut({ data, loading }: Props) {
  if (loading || !data) {
    return (
      <div className={styles.container}>
        <Skeleton height="280px" width="100%" />
      </div>
    );
  }

  const pieData = [
    { id: "yes", value: data.yes_count, label: LABELS.yes, color: COLORS.yes },
    { id: "no", value: data.no_count, label: LABELS.no, color: COLORS.no },
    { id: "no_response", value: data.no_response, label: LABELS.no_response, color: COLORS.no_response },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.chartSection}>
        <DonutChart data={pieData} height={240} maxWidth={280} innerRadius={55} outerRadius={95} paddingAngle={1} />
      </div>
      <div className={styles.legendSection}>
        <ChartLegend
          items={[
            { label: `✅ ${LABELS.yes}`, color: COLORS.yes, value: data.yes_count },
            { label: `❌ ${LABELS.no}`, color: COLORS.no, value: data.no_count },
            { label: `⊘ ${LABELS.no_response}`, color: COLORS.no_response, value: data.no_response },
          ]}
        />
      </div>
    </div>
  );
}
