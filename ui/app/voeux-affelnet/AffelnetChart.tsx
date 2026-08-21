"use client";

import { PieChart } from "@mui/x-charts/PieChart";

import { ChartLegend } from "@/app/_components/statistiques/charts/ChartLegend";
import { ItemChartTooltip } from "@/app/_components/statistiques/charts/ChartTooltip";
import { COLOR_PALETTE } from "@/app/_components/statistiques/constants";

import styles from "./voeux-affelnet.module.scss";

const CONCRETISE_COLOR = COLOR_PALETTE.GREEN_DARK;
const NON_CONCRETISE_COLOR = COLOR_PALETTE.GREY_LIGHT;

export function AffelnetChart({
  totalApprenants = 0,
  apprenantsConcretises = 0,
}: {
  totalApprenants?: number;
  apprenantsConcretises?: number;
}) {
  const nonConcretises = Math.max(totalApprenants - apprenantsConcretises, 0);
  const share = (value: number) => (totalApprenants > 0 ? Math.round((value / totalApprenants) * 100) : 0);

  return (
    <div className={styles.chart}>
      <PieChart
        series={[
          {
            data: [
              { id: "concretise", value: apprenantsConcretises, label: "Vœu concrétisé", color: CONCRETISE_COLOR },
              {
                id: "non-concretise",
                value: nonConcretises,
                label: "Vœu non concrétisé",
                color: NON_CONCRETISE_COLOR,
              },
            ],
            innerRadius: 55,
            outerRadius: 95,
            paddingAngle: 1,
            highlightScope: { highlight: "item" },
            valueFormatter: (item) => `${item.value.toLocaleString("fr-FR")} (${share(item.value)} %)`,
          },
        ]}
        height={240}
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        slots={{ legend: () => null, tooltip: ItemChartTooltip }}
        sx={{ width: "100%", maxWidth: "280px", "& .MuiChartsLegend-root": { display: "none" } }}
      />
      <div className={styles.chartLegend}>
        <ChartLegend
          items={[
            {
              label: "Vœu concrétisé",
              color: CONCRETISE_COLOR,
              value: apprenantsConcretises,
              variation: `${share(apprenantsConcretises)} %`,
              variationColor: COLOR_PALETTE.GREY_NEUTRAL,
            },
            {
              label: "Vœu non concrétisé",
              color: NON_CONCRETISE_COLOR,
              value: nonConcretises,
              variation: `${share(nonConcretises)} %`,
              variationColor: COLOR_PALETTE.GREY_NEUTRAL,
            },
          ]}
        />
      </div>
    </div>
  );
}
