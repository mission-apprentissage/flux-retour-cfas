"use client";

import type { CSSProperties } from "react";
import { Cell, Pie, PieChart, Tooltip } from "recharts";

import { ItemChartTooltip } from "./ChartTooltip";
import styles from "./DonutChart.module.css";

export interface DonutChartItem {
  id: string;
  value: number;
  label: string;
  color: string;
}

interface DonutChartProps {
  data: DonutChartItem[];
  height: number;
  maxWidth: number;
  innerRadius?: number;
  outerRadius?: number | string;
  paddingAngle?: number;
  margin?: number;
  valueFormatter?: (item: DonutChartItem) => string;
}

export function DonutChart({
  data,
  height,
  maxWidth,
  innerRadius = 0,
  outerRadius = "100%",
  paddingAngle = 0,
  margin = 10,
  valueFormatter,
}: DonutChartProps) {
  const rows = data.map((item) => ({
    ...item,
    formatted: valueFormatter ? valueFormatter(item) : item.value.toLocaleString("fr-FR"),
  }));

  return (
    <div className={styles.container} style={{ "--donut-max-width": `${maxWidth}px` } as CSSProperties}>
      <PieChart
        responsive
        width="100%"
        height={height}
        margin={{ top: margin, right: margin, bottom: margin, left: margin }}
      >
        <Pie
          data={rows}
          dataKey="value"
          nameKey="label"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={paddingAngle}
          startAngle={90}
          endAngle={-270}
          stroke="#fff"
          strokeWidth={1}
          animationBegin={0}
          animationDuration={300}
          animationEasing="cubic-bezier(0.66, 0, 0.34, 1)"
        >
          {rows.map((item) => (
            <Cell key={item.id} fill={item.color} />
          ))}
        </Pie>
        <Tooltip
          shared={false}
          content={<ItemChartTooltip />}
          cursor={false}
          offset={8}
          allowEscapeViewBox={{ x: true, y: true }}
          isAnimationActive={false}
          wrapperStyle={{ outline: "none" }}
        />
      </PieChart>
    </div>
  );
}
