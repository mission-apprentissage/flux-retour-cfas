"use client";

import { DetailsDossiersTraitesPieChart } from "../charts/DetailsDossiersTraitesPieChart";
import { isLoadingVariation } from "../hooks/useLoadingVariation";
import { useDossiersTraitesStats, type SegmentStatsParams } from "../hooks/useStatsQueries";
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
  return (
    <StatisticsSection title={title} width={fullWidth ? "full" : "two-thirds"} smallTitle>
      {noData ? (
        <div className={styles.noDataContainer}>
          <div className={styles.noDataPieChartPlaceholder} />
          <NoDataMessage />
        </div>
      ) : (
        <DossiersTraitesChart
          period={period}
          segment={segment}
          region={region}
          mlId={mlId}
          national={national}
          isPublic={isPublic}
        />
      )}
    </StatisticsSection>
  );
}

function DossiersTraitesChart(params: SegmentStatsParams) {
  const { data, isLoading, isFetching, error } = useDossiersTraitesStats(params);
  const loadingVariation = isLoadingVariation(isFetching, isLoading);

  return (
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
  );
}
