"use client";

import { DetailsDossiersTraitesPieChart } from "../charts/DetailsDossiersTraitesPieChart";
import { isLoadingVariation } from "../hooks/useLoadingVariation";
import { useDossiersTraitesStats } from "../hooks/useStatsQueries";
import { NoDataMessage } from "../ui/NoDataMessage";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import styles from "./DossiersTraitesSection.module.css";
import { StatisticsSection } from "./StatisticsSection";
import type {
  SectionWithPeriodAndMlProps,
  SectionWithNoDataProps,
  SectionWithLayoutProps,
  SegmentSectionProps,
} from "./types";

type DossiersTraitesSectionProps = SectionWithPeriodAndMlProps &
  SectionWithNoDataProps &
  SectionWithLayoutProps &
  SegmentSectionProps & { title?: string };

export function DossiersTraitesSection({
  period = "30days",
  segment,
  isPublic = false,
  region,
  mlId,
  fullWidth,
  noData,
  national = false,
  title = "Dossiers traités",
}: DossiersTraitesSectionProps) {
  const { data, isLoading, isFetching, error } = useDossiersTraitesStats({
    period,
    segment,
    region,
    mlId,
    national,
    isPublic,
  });

  const loadingVariation = isLoadingVariation(isFetching, isLoading);

  if (noData) {
    return (
      <StatisticsSection title={title} width={fullWidth ? "full" : "two-thirds"} smallTitle>
        <div className={styles.noDataContainer}>
          <div className={styles.noDataPieChartPlaceholder} />
          <NoDataMessage />
        </div>
      </StatisticsSection>
    );
  }

  return (
    <StatisticsSection title={title} width={fullWidth ? "full" : "two-thirds"} smallTitle>
      <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
        <DetailsDossiersTraitesPieChart
          data={data?.detailsV2}
          dejaConnu={
            data && data.deja_connu_accompagne !== null
              ? { value: data.deja_connu_accompagne, total: data.traites }
              : undefined
          }
          loading={isLoading}
          loadingVariation={loadingVariation}
        />
      </StatsErrorHandler>
    </StatisticsSection>
  );
}
