"use client";

import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import { useState } from "react";

import { RupturantsBarChart } from "../charts/RupturantsBarChart";
import { RupturantsPieChart } from "../charts/RupturantsPieChart";
import { useRupturantsStats } from "../hooks/useStatsQueries";
import type { Period } from "../ui/PeriodSelector";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import styles from "./RupturantsSection.module.css";
import { StatisticsSection } from "./StatisticsSection";

type ChartType = "bar" | "pie";

interface RupturantsSectionProps {
  period?: Period;
}

export function RupturantsSection({ period = "30days" }: RupturantsSectionProps) {
  const [chartType, setChartType] = useState<ChartType>("bar");

  const { data, isLoading, isFetching, error } = useRupturantsStats(period);

  const loadingVariation = isFetching && !isLoading;

  return (
    <StatisticsSection
      title="Jeunes rupturants"
      width="one-third"
      smallTitle
      controls={
        <SegmentedControl
          hideLegend
          segments={[
            {
              label: (
                <span
                  className="fr-icon-line-chart-line"
                  aria-label="Diagramme en barres"
                  title="Diagramme en barres"
                />
              ),
              nativeInputProps: {
                checked: chartType === "bar",
                onChange: () => setChartType("bar"),
              },
            },
            {
              label: (
                <span
                  className="fr-icon-pie-chart-2-line fr-icon--md"
                  aria-label="Diagramme circulaire"
                  title="Diagramme circulaire"
                />
              ),
              nativeInputProps: {
                checked: chartType === "pie",
                onChange: () => setChartType("pie"),
              },
            },
          ]}
          small
        />
      }
      controlsPosition="right"
    >
      <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
        <div className={styles.rupturantsContainer}>
          {chartType === "bar" ? (
            <RupturantsBarChart data={data?.timeSeries || []} loading={isLoading} loadingVariation={loadingVariation} />
          ) : (
            <RupturantsPieChart data={data?.summary} loading={isLoading} loadingVariation={loadingVariation} />
          )}
        </div>
      </StatsErrorHandler>
    </StatisticsSection>
  );
}
