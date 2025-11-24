"use client";

import { BarChart } from "@mui/x-charts/BarChart";
import { ChartsTooltipContainer, ChartsTooltipContainerProps, useAxesTooltip } from "@mui/x-charts/ChartsTooltip";
import { ITimeSeriesPoint } from "shared/models/data/nationalStats.model";

import { ChartLegend } from "./ChartLegend";
import { calculatePercentage, getPercentageColor, RUPTURANTS_COLORS, RUPTURANTS_LABELS } from "./constants";
import { Skeleton } from "./Skeleton";

function CustomTooltip(props: ChartsTooltipContainerProps) {
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
      <div
        style={{
          backgroundColor: "#fff",
          border: "1px solid #e0e0e0",
          borderRadius: "4px",
          padding: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#161616", marginBottom: "4px" }}>
            {axisFormattedValue || String(axisValue)}
          </div>
          {seriesItems.map((item: any, index: number) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                minWidth: "180px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: item.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: "14px", fontWeight: 500, color: "#161616" }}>{item.formattedLabel}</span>
              </div>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "#161616" }}>
                {typeof item.value === "number" ? item.value.toLocaleString("fr-FR") : item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </ChartsTooltipContainer>
  );
}

interface RupturantsBarChartProps {
  data: ITimeSeriesPoint[];
  loading?: boolean;
}

export function RupturantsBarChart({ data, loading }: RupturantsBarChartProps) {
  if (loading || !data || data.length === 0) {
    return (
      <>
        <Skeleton height="180px" width="100%" />
        <div style={{ marginTop: "16px" }}>
          <Skeleton height="60px" width="100%" />
        </div>
      </>
    );
  }

  const dates = data.map((point) => {
    const date = new Date(point.date);
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}`;
  });

  const aTraiterData = data.map((point) => point.stats[0]?.total_a_traiter || 0);
  const traitesData = data.map((point) => point.stats[0]?.total_traites || 0);

  const lastIndex = data.length - 1;
  const totalATraiter = lastIndex >= 0 ? aTraiterData[lastIndex] : 0;
  const totalTraites = lastIndex >= 0 ? traitesData[lastIndex] : 0;

  const firstTraites = data.length > 0 ? traitesData[0] : 0;
  const variationTraites = calculatePercentage(totalTraites, firstTraites);
  const variationColor = getPercentageColor(totalTraites, firstTraites);

  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `${value / 1000}k`;
    }
    return value.toString();
  };

  return (
    <>
      <BarChart
        xAxis={[
          {
            scaleType: "band",
            data: dates,
            disableLine: true,
            disableTicks: true,
            categoryGapRatio: 0.5,
            barGapRatio: 0.2,
          },
        ]}
        yAxis={[
          {
            disableLine: true,
            disableTicks: false,
            valueFormatter: formatYAxis,
          },
        ]}
        series={[
          {
            data: traitesData,
            label: RUPTURANTS_LABELS.traites,
            stack: "total",
            color: RUPTURANTS_COLORS.traites,
          },
          {
            data: aTraiterData,
            label: RUPTURANTS_LABELS.a_traiter,
            stack: "total",
            color: RUPTURANTS_COLORS.a_traiter,
          },
        ]}
        height={180}
        margin={{ right: -5, left: -10, bottom: 10 }}
        slots={{
          legend: () => null,
          tooltip: CustomTooltip,
        }}
        grid={{ horizontal: true }}
      />
      <ChartLegend
        items={[
          { label: RUPTURANTS_LABELS.a_traiter, color: RUPTURANTS_COLORS.a_traiter, value: totalATraiter },
          {
            label: RUPTURANTS_LABELS.traites,
            color: RUPTURANTS_COLORS.traites,
            value: totalTraites,
            variation: variationTraites,
            variationColor: variationColor,
          },
        ]}
      />
    </>
  );
}
