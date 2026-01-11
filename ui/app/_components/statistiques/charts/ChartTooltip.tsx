"use client";

import { ChartsTooltipContainer, useAxesTooltip, useItemTooltip } from "@mui/x-charts/ChartsTooltip";
import type { ChartsTooltipContainerProps } from "@mui/x-charts/ChartsTooltip";

import { DOSSIERS_TRAITES_DESCRIPTIONS, DOSSIERS_TRAITES_LABELS } from "../constants";

import styles from "./ChartTooltip.module.css";

const getDescriptionFromLabel = (label: string): string | null => {
  const entries = Object.entries(DOSSIERS_TRAITES_LABELS) as [keyof typeof DOSSIERS_TRAITES_DESCRIPTIONS, string][];
  const found = entries.find(([, value]) => value === label);
  if (found) {
    return DOSSIERS_TRAITES_DESCRIPTIONS[found[0]];
  }
  return null;
};

export function ItemChartTooltip(props: ChartsTooltipContainerProps) {
  const tooltipData = useItemTooltip();

  if (!tooltipData) {
    return null;
  }

  const displayLabel = typeof tooltipData.label === "string" ? tooltipData.label : String(tooltipData.label || "");
  const rawValue = tooltipData.formattedValue || tooltipData.value;
  const displayValue = typeof rawValue === "number" ? rawValue.toLocaleString("fr-FR") : String(rawValue);
  const displayColor = tooltipData.color;
  const description = getDescriptionFromLabel(displayLabel);

  return (
    <ChartsTooltipContainer trigger="item" {...props}>
      <div className={styles.tooltipContainer}>
        <div className={styles.tooltipContent}>
          <div className={styles.tooltipLeftContent}>
            <div className={styles.tooltipColorDot} style={{ backgroundColor: displayColor }} />
            <span className={styles.tooltipLabel}>{displayLabel}</span>
          </div>
          <span className={styles.tooltipValue}>{displayValue}</span>
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
    </ChartsTooltipContainer>
  );
}

export function AxisChartTooltip(props: ChartsTooltipContainerProps) {
  const tooltipData = useAxesTooltip();

  if (!tooltipData || tooltipData.length === 0) {
    return null;
  }

  const axisTooltip = tooltipData[0];

  if (!axisTooltip?.axisValue) {
    return null;
  }

  const { seriesItems, axisValue, axisFormattedValue } = axisTooltip;

  if (!seriesItems || seriesItems.length === 0) {
    return null;
  }

  return (
    <ChartsTooltipContainer trigger="axis" {...props}>
      <div className={styles.tooltipContainer}>
        <div className={styles.axisTooltipItems}>
          <div className={styles.axisTooltipTitle}>{axisFormattedValue || String(axisValue)}</div>
          {seriesItems
            .filter((item) => item.formattedLabel)
            .reverse()
            .map((item, index) => (
              <div key={index} className={styles.tooltipContent}>
                <div className={styles.tooltipLeftContent}>
                  <div className={styles.tooltipColorDot} style={{ backgroundColor: item.color }} />
                  <span className={styles.tooltipLabel}>{item.formattedLabel}</span>
                </div>
                <span className={styles.tooltipValue}>
                  {typeof item.value === "number" ? item.value.toLocaleString("fr-FR") : String(item.value)}
                </span>
              </div>
            ))}
        </div>
      </div>
    </ChartsTooltipContainer>
  );
}
