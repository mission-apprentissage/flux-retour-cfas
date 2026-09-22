"use client";

import { Bar, BarChart, Tooltip, XAxis, YAxis } from "recharts";
import type { ICollaborationObjectifs } from "shared/models/data/nationalStats.model";

import { Skeleton } from "@/app/_components/common/Skeleton";

import { ItemChartTooltip } from "./ChartTooltip";
import { MOTIFS_CONFIG } from "./motifsConfig";
import styles from "./ObjectifsBarChart.module.css";

interface ObjectifsBarChartProps {
  data?: ICollaborationObjectifs & { total_dossiers: number };
  loading?: boolean;
}

const BAR_COLOR = "#6A6AF4";
const BACKGROUND_COLOR = "#E3E3FD";
const ROW_HEIGHT = 34;
const LABEL_WIDTH = 236;

function MotifTick({ x = 0, y = 0, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  const motif = MOTIFS_CONFIG.find((item) => item.label === payload?.value);
  return (
    <g transform={`translate(${x - LABEL_WIDTH + 8}, ${y})`}>
      {motif && (
        <svg x={0} y={-8} width={16} height={16} viewBox="0 0 24 24" fill="#000091" aria-hidden="true">
          <path d={motif.svgPath} />
        </svg>
      )}
      <text x={24} y={0} dy={4} fontSize={13} fill="#161616">
        {payload?.value}
      </text>
    </g>
  );
}

/**
 * Objectifs d'accompagnement des dossiers de collaboration : un dossier peut cumuler plusieurs
 * objectifs, chaque barre est rapportée au total des dossiers envoyés (fond clair).
 */
export function ObjectifsBarChart({ data, loading }: ObjectifsBarChartProps) {
  if (loading || !data) {
    return <Skeleton height="320px" width="100%" />;
  }

  const total = data.total_dossiers;
  const rows = MOTIFS_CONFIG.map((motif) => {
    const value = data[motif.key] ?? 0;
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return {
      key: motif.key,
      label: motif.label,
      value,
      color: BAR_COLOR,
      formatted: `${value.toLocaleString("fr-FR")} (${pct}%)`,
    };
  });
  const summary = rows.map((row) => `${row.label} : ${row.formatted}`).join(", ");

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.totalLabel}>Total dossiers envoyés</span>
        <strong>{total.toLocaleString("fr-FR")}</strong>
      </div>
      <div role="img" aria-label={`Objectifs d'accompagnement sur ${total} dossiers envoyés : ${summary}`}>
        <BarChart
          responsive
          width="100%"
          height={rows.length * ROW_HEIGHT + 10}
          data={rows}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
          barCategoryGap="30%"
        >
          <XAxis type="number" domain={[0, Math.max(total, 1)]} hide />
          <YAxis
            type="category"
            dataKey="label"
            width={LABEL_WIDTH}
            axisLine={false}
            tickLine={false}
            interval={0}
            tick={<MotifTick />}
          />
          <Bar
            dataKey="value"
            fill={BAR_COLOR}
            background={{ fill: BACKGROUND_COLOR, radius: 2 }}
            radius={2}
            animationBegin={0}
            animationDuration={300}
            animationEasing="cubic-bezier(0.66, 0, 0.34, 1)"
          />
          <Tooltip
            shared={false}
            content={<ItemChartTooltip />}
            cursor={false}
            offset={8}
            allowEscapeViewBox={{ x: true, y: true }}
            isAnimationActive={false}
            wrapperStyle={{ outline: "none", zIndex: 1500 }}
          />
        </BarChart>
      </div>
      <ul className={styles.legend}>
        {rows.map((row) => (
          <li key={row.key} className={styles.legendItem}>
            <span className={styles.legendLabel}>{row.label}</span>
            <span className={styles.legendValue}>{row.formatted}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
