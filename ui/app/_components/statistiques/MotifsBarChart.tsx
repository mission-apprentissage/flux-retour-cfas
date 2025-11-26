"use client";

import { BarPlot } from "@mui/x-charts/BarChart";
import { ChartContainer } from "@mui/x-charts/ChartContainer";
import { ChartsGrid } from "@mui/x-charts/ChartsGrid";
import { ChartsTooltipContainer, useItemTooltip } from "@mui/x-charts/ChartsTooltip";
import { ChartsXAxis } from "@mui/x-charts/ChartsXAxis";
import { ChartsYAxis } from "@mui/x-charts/ChartsYAxis";
import { useXScale, useYScale } from "@mui/x-charts/hooks";
import { IAccompagnementConjointMotifs } from "shared/models/data/nationalStats.model";

import tooltipStyles from "./ChartTooltip.module.css";
import styles from "./MotifsBarChart.module.css";
import { Skeleton } from "./Skeleton";

interface MotifsBarChartProps {
  data?: IAccompagnementConjointMotifs;
  loading?: boolean;
}

const MOTIFS_CONFIG = [
  {
    key: "mobilite",
    label: "Mobilité",
    icon: "fr-icon-car-fill",
    svgPath:
      "M19 20H5V21C5 21.5523 4.55228 22 4 22H3C2.44772 22 2 21.5523 2 21V12L4.51334 5.29775C4.80607 4.51715 5.55231 4 6.386 4H17.614C18.4477 4 19.1939 4.51715 19.4867 5.29775L22 12V21C22 21.5523 21.5523 22 21 22H20C19.4477 22 19 21.5523 19 21V20ZM4.136 12H19.864L17.614 6H6.386L4.136 12ZM6.5 17C7.32843 17 8 16.3284 8 15.5C8 14.6716 7.32843 14 6.5 14C5.67157 14 5 14.6716 5 15.5C5 16.3284 5.67157 17 6.5 17ZM17.5 17C18.3284 17 19 16.3284 19 15.5C19 14.6716 18.3284 14 17.5 14C16.6716 14 16 14.6716 16 15.5C16 16.3284 16.6716 17 17.5 17Z",
  },
  {
    key: "logement",
    label: "Logement",
    icon: "fr-icon-home-4-fill",
    svgPath:
      "M20 20C20 20.5523 19.5523 21 19 21H5C4.44772 21 4 20.5523 4 20V11L1 11L11.3273 1.6115C11.7087 1.26475 12.2913 1.26475 12.6727 1.6115L23 11L20 11V20ZM11 13V19H13V13H11Z",
  },
  {
    key: "sante",
    label: "Santé",
    icon: "fr-icon-stethoscope-fill",
    svgPath:
      "M8 3V5H6V9C6 11.2091 7.79086 13 10 13C12.2091 13 14 11.2091 14 9V5H12V3H15C15.5523 3 16 3.44772 16 4V9C16 11.9727 13.8381 14.4405 11.0008 14.9169L11 16.5C11 18.433 12.567 20 14.5 20C15.9973 20 17.275 19.0598 17.7749 17.7375C16.7283 17.27 16 16.2201 16 15C16 13.3431 17.3431 12 19 12C20.6569 12 22 13.3431 22 15C22 16.3711 21.0802 17.5274 19.824 17.8854C19.2102 20.252 17.0592 22 14.5 22C11.4624 22 9 19.5376 9 16.5L9.00019 14.9171C6.16238 14.4411 4 11.9731 4 9V4C4 3.44772 4.44772 3 5 3H8Z",
  },
  {
    key: "finance",
    label: "Finance",
    icon: "fr-icon-money-euro-circle-fill",
    svgPath:
      "M12.0049 22.0027C6.48204 22.0027 2.00488 17.5256 2.00488 12.0027C2.00488 6.4799 6.48204 2.00275 12.0049 2.00275C17.5277 2.00275 22.0049 6.4799 22.0049 12.0027C22.0049 17.5256 17.5277 22.0027 12.0049 22.0027ZM10.0549 11.0027C10.2865 9.86163 11.2954 9.00275 12.5049 9.00275C13.1201 9.00275 13.6834 9.22496 14.1189 9.59351L15.8198 8.45951C14.9973 7.56402 13.8166 7.00275 12.5049 7.00275C10.1886 7.00275 8.28107 8.75277 8.03235 11.0027H7.00488V13.0027H8.03235C8.28107 15.2527 10.1886 17.0027 12.5049 17.0027C13.8166 17.0027 14.9973 16.4415 15.8198 15.546L14.1188 14.412C13.6833 14.7806 13.1201 15.0027 12.5049 15.0027C11.2954 15.0027 10.2865 14.1439 10.0549 13.0027H15.0049V11.0027H10.0549Z",
  },
  {
    key: "administratif",
    label: "Administratif",
    icon: "fr-icon-file-text-fill",
    svgPath:
      "M21 9V20.9925C21 21.5511 20.5552 22 20.0066 22H3.9934C3.44495 22 3 21.556 3 21.0082V2.9918C3 2.45531 3.44694 2 3.99826 2H14V8C14 8.55228 14.4477 9 15 9H21ZM21 7H16V2.00318L21 7ZM8 7V9H11V7H8ZM8 11V13H16V11H8ZM8 15V17H16V15H8Z",
  },
  {
    key: "reorientation",
    label: "Réorientation",
    icon: "fr-icon-compass-3-fill",
    svgPath:
      "M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM16.5 7.5L10 10L7.5 16.5L14 14L16.5 7.5ZM12 13C11.4477 13 11 12.5523 11 12C11 11.4477 11.4477 11 12 11C12.5523 11 13 11.4477 13 12C13 12.5523 12.5523 13 12 13Z",
  },
  {
    key: "recherche_emploi",
    label: "Recherche d'emploi",
    icon: "fr-icon-briefcase-fill",
    svgPath:
      "M7 5V2C7 1.44772 7.44772 1 8 1H16C16.5523 1 17 1.44772 17 2V5H21C21.5523 5 22 5.44772 22 6V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V6C2 5.44772 2.44772 5 3 5H7ZM4 15V19H20V15H4ZM11 11V13H13V11H11ZM9 3V5H15V3H9Z",
  },
  {
    key: "autre",
    label: "Autre",
    icon: "fr-icon-question-fill",
    svgPath:
      "M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM11 15V17H13V15H11ZM13 13.3551C14.4457 12.9248 15.5 11.5855 15.5 10C15.5 8.067 13.933 6.5 12 6.5C10.302 6.5 8.88637 7.70919 8.56731 9.31346L10.5288 9.70577C10.6656 9.01823 11.2723 8.5 12 8.5C12.8284 8.5 13.5 9.17157 13.5 10C13.5 10.8284 12.8284 11.5 12 11.5C11.4477 11.5 11 11.9477 11 12.5V14H13V13.3551Z",
  },
] as const;

const BAR_COLOR = "#CACAFB";
const ICON_COLOR = "#000091";
const ICON_SIZE = 16;

interface IconsOverlayProps {
  values: number[];
}

function IconsOverlay({ values }: IconsOverlayProps) {
  const xScale = useXScale<"band">();
  const yScale = useYScale();

  if (!xScale || !yScale) return null;

  const bandwidth = xScale.bandwidth?.() || 0;
  const y0 = yScale(0) ?? 0;

  return (
    <g>
      {MOTIFS_CONFIG.map((motif, index) => {
        const x = xScale(motif.label);
        if (x === undefined) return null;

        const value = values[index] || 0;
        const yValue = value > 0 ? (yScale(value) ?? y0) : y0;

        const iconX = x + bandwidth / 2 - ICON_SIZE / 2;
        const iconY = yValue - ICON_SIZE - 4;

        return (
          <svg
            key={motif.key}
            x={iconX}
            y={iconY}
            width={ICON_SIZE}
            height={ICON_SIZE}
            viewBox="0 0 24 24"
            fill={ICON_COLOR}
          >
            <path d={motif.svgPath} />
          </svg>
        );
      })}
    </g>
  );
}

interface MotifsTooltipProps {
  labels: string[];
}

function MotifsTooltip({ labels }: MotifsTooltipProps) {
  const tooltipData = useItemTooltip();

  if (!tooltipData) {
    return null;
  }

  const dataIndex = tooltipData.identifier.dataIndex ?? 0;
  const displayLabel = labels[dataIndex] || "";
  const rawValue = tooltipData.formattedValue || tooltipData.value;
  const displayValue = typeof rawValue === "number" ? rawValue.toLocaleString("fr-FR") : String(rawValue);
  const displayColor = tooltipData.color;

  return (
    <ChartsTooltipContainer trigger="item">
      <div className={tooltipStyles.tooltipContainer}>
        <div className={tooltipStyles.tooltipContent}>
          <div className={tooltipStyles.tooltipLeftContent}>
            <div className={tooltipStyles.tooltipColorDot} style={{ backgroundColor: displayColor }} />
            <span className={tooltipStyles.tooltipLabel}>{displayLabel}</span>
          </div>
          <span className={tooltipStyles.tooltipValue}>{displayValue}</span>
        </div>
      </div>
    </ChartsTooltipContainer>
  );
}

export function MotifsBarChart({ data, loading }: MotifsBarChartProps) {
  if (loading || !data) {
    return (
      <div className={styles.container}>
        <Skeleton height="200px" width="100%" />
        <div className={styles.legendSkeleton}>
          <Skeleton height="100px" width="100%" />
        </div>
      </div>
    );
  }

  const chartData = MOTIFS_CONFIG.map((motif) => ({
    motif: motif.label,
    value: data[motif.key as keyof IAccompagnementConjointMotifs] || 0,
  }));

  const xLabels = chartData.map((d) => d.motif);
  const values = chartData.map((d) => d.value);
  const maxValue = Math.max(...values);
  const yAxisMax = Math.ceil(maxValue * 1.2) || 1;

  return (
    <div className={styles.container}>
      <ChartContainer
        xAxis={[
          {
            scaleType: "band",
            data: xLabels,
            categoryGapRatio: 0.7,
            valueFormatter: (value) => value,
            tickLabelStyle: {
              angle: 75,
              textAnchor: "start",
              fontSize: 12,
            },
          },
        ]}
        yAxis={[
          {
            tickMinStep: 1,
            max: yAxisMax,
          },
        ]}
        series={[
          {
            type: "bar",
            data: values,
            color: BAR_COLOR,
          },
        ]}
        height={350}
        margin={{ top: 30, bottom: 80, left: -20, right: 10 }}
      >
        <ChartsGrid horizontal />
        <BarPlot />
        <IconsOverlay values={values} />
        <ChartsXAxis position="bottom" height={80} tickLabelMinGap={0} disableTicks disableLine />
        <ChartsYAxis />
        <MotifsTooltip labels={xLabels} />
      </ChartContainer>

      <div className={styles.legend}>
        {MOTIFS_CONFIG.map((motif) => {
          const value = data[motif.key as keyof IAccompagnementConjointMotifs] || 0;
          return (
            <div key={motif.key} className={styles.legendItem}>
              <i className={`${motif.icon} fr-icon--sm ${styles.legendIcon}`} aria-hidden="true" />
              <span className={styles.legendLabel}>{motif.label}</span>
              <span className={styles.legendValue}>{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
