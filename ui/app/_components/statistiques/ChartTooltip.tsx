"use client";

import { ChartsTooltipContainer, useItemTooltip } from "@mui/x-charts/ChartsTooltip";
import type { ChartsTooltipContainerProps } from "@mui/x-charts/ChartsTooltip";

import styles from "./ChartTooltip.module.css";

export function ItemChartTooltip(props: ChartsTooltipContainerProps) {
  const tooltipData = useItemTooltip();

  if (!tooltipData) {
    return null;
  }

  const displayLabel = typeof tooltipData.label === "string" ? tooltipData.label : String(tooltipData.label || "");
  const rawValue = tooltipData.formattedValue || tooltipData.value;
  const displayValue = typeof rawValue === "number" ? rawValue.toLocaleString("fr-FR") : String(rawValue);
  const displayColor = tooltipData.color;

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
      </div>
    </ChartsTooltipContainer>
  );
}
