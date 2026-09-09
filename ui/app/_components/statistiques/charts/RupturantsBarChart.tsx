"use client";

import { Bar, CartesianGrid, ComposedChart, Line, Tooltip, XAxis, YAxis } from "recharts";
import { ITimeSeriesPoint } from "shared/models/data/nationalStats.model";

import { Skeleton } from "@/app/_components/common/Skeleton";

import { calculatePercentage, getPercentageColor, RUPTURANTS_COLORS, RUPTURANTS_LABELS } from "../constants";

import { ChartLegend } from "./ChartLegend";
import { AxisChartTooltip } from "./ChartTooltip";
import styles from "./RupturantsBarChart.module.css";
import { niceTicks } from "./ticks";

interface RupturantsBarChartProps {
  data: ITimeSeriesPoint[];
  loading?: boolean;
  loadingVariation?: boolean;
}

const ANIMATION = {
  animationBegin: 0,
  animationDuration: 300,
  animationEasing: "cubic-bezier(0.66, 0, 0.34, 1)",
} as const;

const TICK_STYLE = { fontSize: 12, fill: "#161616" };

const formatDate = (value: Date) => {
  const date = new Date(value);
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}`;
};

const formatYAxis = (value: number) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return value.toString();
};

export function RupturantsBarChart({ data, loading, loadingVariation }: RupturantsBarChartProps) {
  if (loading || !data || data.length === 0) {
    return (
      <>
        <Skeleton height="260px" width="100%" />
        <div className={styles.legendSkeleton}>
          <Skeleton height="60px" width="100%" />
        </div>
      </>
    );
  }

  const rows = data.map((point) => ({
    date: formatDate(point.date),
    a_traiter: point.stats[0]?.total_a_traiter || 0,
    traites: point.stats[0]?.total_traites || 0,
  }));

  const last = rows[rows.length - 1];
  const totalATraiter = last.a_traiter;
  const totalTraites = last.traites;

  const yTicks = niceTicks(Math.max(...rows.map((row) => row.a_traiter + row.traites)), 5);

  const firstTraites = rows[0].traites;
  const variationTraites = calculatePercentage(totalTraites, firstTraites);
  const variationColor = getPercentageColor(totalTraites, firstTraites);

  return (
    <div className={styles.chart}>
      <ComposedChart
        responsive
        width="100%"
        height={320}
        data={rows}
        margin={{ top: 12, right: 5, bottom: 10, left: 0 }}
        barCategoryGap="37.5%"
      >
        <CartesianGrid horizontal vertical={false} stroke="#ddd" />
        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={TICK_STYLE} />
        <YAxis
          axisLine={false}
          tickLine={{ stroke: "#161616" }}
          tick={TICK_STYLE}
          tickFormatter={formatYAxis}
          width={45}
          ticks={yTicks}
          domain={[0, yTicks[yTicks.length - 1]]}
          niceTicks="none"
        />
        <Bar
          dataKey="traites"
          name={RUPTURANTS_LABELS.traites}
          stackId="total"
          fill={RUPTURANTS_COLORS.traites}
          {...ANIMATION}
        />
        <Bar
          dataKey="a_traiter"
          name={RUPTURANTS_LABELS.a_traiter}
          stackId="total"
          fill={RUPTURANTS_COLORS.a_traiter}
          {...ANIMATION}
        />
        <Line
          dataKey="traites"
          stroke={RUPTURANTS_COLORS.traites}
          strokeWidth={2}
          dot={{ r: 3, fill: "#fff", strokeWidth: 2 }}
          activeDot={false}
          tooltipType="none"
          legendType="none"
          {...ANIMATION}
        />
        <Tooltip
          content={<AxisChartTooltip />}
          cursor={false}
          offset={8}
          allowEscapeViewBox={{ x: true, y: true }}
          isAnimationActive={false}
          wrapperStyle={{ outline: "none", zIndex: 1500 }}
        />
      </ComposedChart>
      <div className={styles.legend}>
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
