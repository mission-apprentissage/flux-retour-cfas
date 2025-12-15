"use client";

import { BarPlot } from "@mui/x-charts/BarChart";
import { ChartContainer } from "@mui/x-charts/ChartContainer";
import { ChartsGrid } from "@mui/x-charts/ChartsGrid";
import { ChartsXAxis } from "@mui/x-charts/ChartsXAxis";
import { ChartsYAxis } from "@mui/x-charts/ChartsYAxis";
import { LinePlot, MarkPlot } from "@mui/x-charts/LineChart";
import { ITimeSeriesPoint } from "shared/models/data/nationalStats.model";

import { calculatePercentage, getPercentageColor, RUPTURANTS_COLORS, RUPTURANTS_LABELS } from "../constants";
import { Skeleton } from "../ui/Skeleton";

import { ChartLegend } from "./ChartLegend";
import { AxisChartTooltip } from "./ChartTooltip";

interface RupturantsBarChartProps {
  data: ITimeSeriesPoint[];
  loading?: boolean;
  loadingVariation?: boolean;
}

export function RupturantsBarChart({ data, loading, loadingVariation }: RupturantsBarChartProps) {
  if (loading || !data || data.length === 0) {
    return (
      <>
        <Skeleton height="260px" width="100%" />
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
      return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
    }
    return value.toString();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <ChartContainer
        xAxis={[
          {
            id: "x-axis",
            scaleType: "band",
            data: dates,
            disableLine: true,
            disableTicks: true,
            categoryGapRatio: 0.75,
            barGapRatio: 0.2,
          },
        ]}
        yAxis={[
          {
            id: "y-axis",
            disableLine: true,
            disableTicks: false,
            valueFormatter: formatYAxis,
          },
        ]}
        series={[
          {
            type: "bar",
            data: traitesData,
            label: RUPTURANTS_LABELS.traites,
            stack: "total",
            color: RUPTURANTS_COLORS.traites,
          },
          {
            type: "bar",
            data: aTraiterData,
            label: RUPTURANTS_LABELS.a_traiter,
            stack: "total",
            color: RUPTURANTS_COLORS.a_traiter,
          },
          {
            type: "line",
            data: traitesData,
            color: RUPTURANTS_COLORS.traites,
            showMark: true,
            disableHighlight: true,
          },
        ]}
        height={320}
        margin={{ right: -5, left: -10, bottom: 10 }}
      >
        <ChartsGrid horizontal />
        <BarPlot />
        <LinePlot />
        <MarkPlot slotProps={{ mark: { r: 3 } }} />
        <ChartsXAxis />
        <ChartsYAxis />
        <AxisChartTooltip />
      </ChartContainer>
      <div style={{ marginTop: "auto" }}>
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
          loadingVariation={loadingVariation}
        />
      </div>
    </div>
  );
}
