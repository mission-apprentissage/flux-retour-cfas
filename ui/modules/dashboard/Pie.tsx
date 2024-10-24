"use client";

import type { PieCustomLayerProps } from "@nivo/pie";
import dynamic from "next/dynamic";

const ResponsivePie = dynamic(() => import("@nivo/pie").then((m) => m.ResponsivePie), { ssr: false });

function CenteredMetric({ dataWithArc, centerX, centerY }: PieCustomLayerProps<any>) {
  const total = dataWithArc.reduce((acc, datum) => acc + datum.value, 0);
  return (
    <>
      <text
        x={centerX}
        y={centerY - 10}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fill: "#3A3A3A", fontSize: "28px", fontWeight: "bold" }}
      >
        {`${total}`}
      </text>
      <text
        x={centerX}
        y={centerY + 15}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fill: "#666666", fontSize: "14px" }}
      >
        OFA
      </text>
    </>
  );
}

export function Pie({ data }: { data: any[] }) {
  return (
    <ResponsivePie
      margin={{ top: 32, right: 32, bottom: 32, left: 32 }}
      data={data}
      innerRadius={0.6}
      cornerRadius={3}
      activeOuterRadiusOffset={8}
      enableArcLinkLabels={false}
      colors={{ datum: "data.color" }}
      enableArcLabels={false}
      layers={["arcs", CenteredMetric]}
    />
  );
}
