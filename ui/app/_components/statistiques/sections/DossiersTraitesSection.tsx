"use client";

import { DetailsDossiersTraitesPieChart } from "../charts/DetailsDossiersTraitesPieChart";
import { useDossiersTraitesStats } from "../hooks/useStatsQueries";
import { NoDataMessage } from "../ui/NoDataMessage";
import type { Period } from "../ui/PeriodSelector";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import styles from "./DossiersTraitesSection.module.css";
import { StatisticsSection } from "./StatisticsSection";

interface DossiersTraitesSectionProps {
  period?: Period;
  region?: string;
  mlId?: string;
  fullWidth?: boolean;
  noData?: boolean;
}

export function DossiersTraitesSection({
  period = "30days",
  region,
  mlId,
  fullWidth,
  noData,
}: DossiersTraitesSectionProps) {
  const { data, isLoading, isFetching, error } = useDossiersTraitesStats(period, region, mlId);

  const loadingVariation = isFetching && !isLoading;

  if (noData) {
    return (
      <StatisticsSection title="Dossiers traités" width={fullWidth ? "full" : "two-thirds"} smallTitle>
        <div className={styles.noDataContainer}>
          <div className={styles.noDataPieChartPlaceholder} />
          <NoDataMessage />
        </div>
      </StatisticsSection>
    );
  }

  return (
    <StatisticsSection title="Dossiers traités" width={fullWidth ? "full" : "two-thirds"} smallTitle>
      <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
        <DetailsDossiersTraitesPieChart data={data?.details} loading={isLoading} loadingVariation={loadingVariation} />
      </StatsErrorHandler>
    </StatisticsSection>
  );
}
