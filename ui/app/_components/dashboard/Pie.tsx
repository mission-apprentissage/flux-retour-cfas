"use client";

import dynamic from "next/dynamic";

import styles from "./pie.module.scss";

// Chargé à la demande : le graphique ne concerne que les organismes ayant des formateurs rattachés.
const PieChart = dynamic(() => import("@mui/x-charts/PieChart").then((m) => m.PieChart), { ssr: false });

interface PieDatum {
  id: string;
  value: number;
  color: string;
}

export function Pie({ data }: { data: PieDatum[] }) {
  const total = data.reduce((acc, datum) => acc + datum.value, 0);

  return (
    <div className={styles.wrapper}>
      <PieChart
        series={[
          {
            data: data.map((datum) => ({ id: datum.id, value: datum.value, label: datum.id, color: datum.color })),
            innerRadius: "60%",
            cornerRadius: 3,
            highlightScope: { highlight: "item" },
          },
        ]}
        height={250}
        margin={{ top: 32, right: 32, bottom: 32, left: 32 }}
        hideLegend
      />
      <div className={styles.centeredMetric} aria-hidden="true">
        <span className={styles.total}>{total}</span>
        <span className={styles.unit}>OFA</span>
      </div>
    </div>
  );
}
