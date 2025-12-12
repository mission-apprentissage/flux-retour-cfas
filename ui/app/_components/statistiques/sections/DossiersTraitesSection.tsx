"use client";

import { DetailsDossiersTraitesPieChart } from "../charts/DetailsDossiersTraitesPieChart";
import { isLoadingVariation } from "../hooks/useLoadingVariation";
import { useDossiersTraitesStats } from "../hooks/useStatsQueries";
import { NoDataMessage } from "../ui/NoDataMessage";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import styles from "./DossiersTraitesSection.module.css";
import { StatisticsSection } from "./StatisticsSection";
import type { SectionWithPeriodAndMlProps, SectionWithNoDataProps, SectionWithLayoutProps } from "./types";

type DossiersTraitesSectionProps = SectionWithPeriodAndMlProps & SectionWithNoDataProps & SectionWithLayoutProps;

export function DossiersTraitesSection({
  period = "30days",
  region,
  mlId,
  fullWidth,
  noData,
  national = false,
}: DossiersTraitesSectionProps) {
  const { data, isLoading, isFetching, error } = useDossiersTraitesStats(period, region, mlId, national);

  const loadingVariation = isLoadingVariation(isFetching, isLoading);

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
