"use client";

import type { TooltipContentProps, TooltipPayloadEntry } from "recharts";

import {
  DOSSIERS_TRAITES_DESCRIPTIONS,
  DOSSIERS_TRAITES_LABELS,
  DOSSIERS_TRAITES_V2_DESCRIPTIONS,
  DOSSIERS_TRAITES_V2_LABELS,
} from "../constants";

import styles from "./ChartTooltip.module.css";

const getDescriptionFromLabel = (label: string): string | null => {
  const v2Entries = Object.entries(DOSSIERS_TRAITES_V2_LABELS) as [
    keyof typeof DOSSIERS_TRAITES_V2_DESCRIPTIONS,
    string,
  ][];
  const v2 = v2Entries.find(([, value]) => value === label);
  if (v2) {
    return DOSSIERS_TRAITES_V2_DESCRIPTIONS[v2[0]];
  }
  const v1Entries = Object.entries(DOSSIERS_TRAITES_LABELS) as [keyof typeof DOSSIERS_TRAITES_DESCRIPTIONS, string][];
  const v1 = v1Entries.find(([, value]) => value === label);
  if (v1) {
    return DOSSIERS_TRAITES_DESCRIPTIONS[v1[0]];
  }
  return null;
};

const formatValue = (value: unknown): string =>
  typeof value === "number" ? value.toLocaleString("fr-FR") : String(value ?? "");

const entryLabel = (entry: TooltipPayloadEntry): string => String(entry.payload?.label ?? entry.name ?? "");
const entryColor = (entry: TooltipPayloadEntry): string | undefined =>
  entry.payload?.color ?? entry.color ?? entry.fill;
const entryValue = (entry: TooltipPayloadEntry): string => entry.payload?.formatted ?? formatValue(entry.value);

export function ItemChartTooltip({ active, payload }: Partial<TooltipContentProps>) {
  const entry = payload?.[0];

  if (!active || !entry) {
    return null;
  }

  const displayLabel = entryLabel(entry);
  const description = getDescriptionFromLabel(displayLabel);

  return (
    <div className={styles.tooltipContainer}>
      <div className={styles.tooltipContent}>
        <div className={styles.tooltipLeftContent}>
          <div className={styles.tooltipColorDot} style={{ backgroundColor: entryColor(entry) }} />
          <span className={styles.tooltipLabel}>{displayLabel}</span>
        </div>
        <span className={styles.tooltipValue}>{entryValue(entry)}</span>
      </div>
      {description && (
        <p className={styles.tooltipDescription}>
          {description.split("\n").map((line, index) => (
            <span key={index}>
              {line}
              {index < description.split("\n").length - 1 && <br />}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

export function AxisChartTooltip({ active, payload, label }: Partial<TooltipContentProps>) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className={styles.tooltipContainer}>
      <div className={styles.axisTooltipItems}>
        <div className={styles.axisTooltipTitle}>{String(label ?? "")}</div>
        {[...payload].reverse().map((entry, index) => (
          <div key={index} className={styles.tooltipContent}>
            <div className={styles.tooltipLeftContent}>
              <div className={styles.tooltipColorDot} style={{ backgroundColor: entryColor(entry) }} />
              <span className={styles.tooltipLabel}>{String(entry.name ?? "")}</span>
            </div>
            <span className={styles.tooltipValue}>{formatValue(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
