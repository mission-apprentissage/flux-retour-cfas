"use client";

import { BarChart } from "@mui/x-charts/BarChart";
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
          tooltip: AxisChartTooltip,
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
        loadingVariation={loadingVariation}
      />
    </>
  );
}
