"use client";

import { Bar, BarChart, CartesianGrid, Tooltip, type TooltipContentProps, XAxis, YAxis } from "recharts";
import type { ICollaborationMois } from "shared/models/data/nationalStats.model";

import { Skeleton } from "@/app/_components/common/Skeleton";

import { COLOR_PALETTE } from "../constants";

import { ChartLegend } from "./ChartLegend";
import tooltipStyles from "./ChartTooltip.module.css";
import styles from "./CollabMensuelChart.module.css";
import { niceTicks } from "./ticks";

const SERIES = [
  { key: "envoyes", label: "Dossiers envoyés par les CFA", color: "#CACAFB" },
  { key: "contactes", label: "Jeunes contactés par les Missions Locales", color: "#6A6AF4" },
  { key: "acceptes", label: "Jeunes ayant accepté l'accompagnement ML", color: COLOR_PALETTE.GREEN_LIGHT },
] as const;

const TICK_STYLE = { fontSize: 12, fill: "#161616" };

const formatMonth = (mois: string) => {
  const [year, month] = mois.split("-").map(Number);
  const label = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("fr-FR", { month: "short", timeZone: "UTC" });
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} ${year}`;
};

type CumulRow = ICollaborationMois & { cumul: Record<(typeof SERIES)[number]["key"], number> };

function MensuelTooltip({ active, payload, label }: Partial<TooltipContentProps>) {
  const row = payload?.[0]?.payload as CumulRow | undefined;
  if (!active || !row) return null;

  return (
    <div className={tooltipStyles.tooltipContainer}>
      <div className={tooltipStyles.axisTooltipItems}>
        <div className={tooltipStyles.axisTooltipTitle}>{String(label ?? "")}</div>
        {SERIES.map((serie) => (
          <div key={serie.key} className={tooltipStyles.tooltipContent}>
            <div className={tooltipStyles.tooltipLeftContent}>
              <div className={tooltipStyles.tooltipColorDot} style={{ backgroundColor: serie.color }} />
              <span className={tooltipStyles.tooltipLabel}>{serie.label}</span>
            </div>
            <span className={tooltipStyles.tooltipValue}>
              {row.cumul[serie.key].toLocaleString("fr-FR")} (+{row[serie.key].toLocaleString("fr-FR")})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Cumul des cohortes par mois d'envoi, sur la période affichée. Les barres s'emboîtent (acceptés ⊂ contactés ⊂ envoyés),
 * d'où l'empilement des écarts ; l'infobulle donne le cumul et, entre parenthèses, l'apport du mois.
 */
export function CollabMensuelChart({ data, loading }: { data?: ICollaborationMois[]; loading?: boolean }) {
  if (loading || !data) return <Skeleton height="280px" width="100%" />;

  const cumul = { envoyes: 0, contactes: 0, acceptes: 0 };
  const rows = data.map((row) => {
    cumul.envoyes += row.envoyes;
    cumul.contactes += row.contactes;
    cumul.acceptes += row.acceptes;
    return {
      ...row,
      cumul: { ...cumul },
      label: formatMonth(row.mois),
      part_acceptes: cumul.acceptes,
      part_contactes: Math.max(cumul.contactes - cumul.acceptes, 0),
      part_envoyes: Math.max(cumul.envoyes - cumul.contactes, 0),
    };
  });
  const yTicks = niceTicks(Math.max(1, cumul.envoyes), 4);
  const totals = SERIES.map((serie) => ({
    label: serie.label,
    color: serie.color,
    value: data.reduce((sum, row) => sum + row[serie.key], 0),
  }));

  return (
    <div className={styles.container}>
      <div className={styles.chart}>
        <BarChart responsive width="100%" height={280} data={rows} margin={{ top: 12, right: 5, bottom: 10, left: 0 }}>
          <CartesianGrid horizontal vertical={false} stroke="#ddd" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={TICK_STYLE} />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={TICK_STYLE}
            width={40}
            ticks={yTicks}
            domain={[0, yTicks[yTicks.length - 1]]}
          />
          <Bar dataKey="part_acceptes" stackId="mois" fill={SERIES[2].color} isAnimationActive={false} />
          <Bar dataKey="part_contactes" stackId="mois" fill={SERIES[1].color} isAnimationActive={false} />
          <Bar dataKey="part_envoyes" stackId="mois" fill={SERIES[0].color} isAnimationActive={false} />
          <Tooltip
            content={<MensuelTooltip />}
            cursor={{ fill: "rgba(0, 0, 145, 0.05)" }}
            isAnimationActive={false}
            wrapperStyle={{ outline: "none", zIndex: 1500 }}
          />
        </BarChart>
      </div>
      <div className={styles.legend}>
        <ChartLegend items={totals} />
      </div>
    </div>
  );
}
