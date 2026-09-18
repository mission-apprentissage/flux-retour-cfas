"use client";

import { useState } from "react";

import { TraitementCards } from "../cards/TraitementCards";
import { isLoadingVariation } from "../hooks/useLoadingVariation";
import { useDossiersTraitesStats, useTraitementStats } from "../hooks/useStatsQueries";
import { PeriodSelector, type Period } from "../ui/PeriodSelector";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import { DossiersTraitesSection } from "./DossiersTraitesSection";
import styles from "./IdentificationSuiviSection.module.css";
import { RupturantsSection } from "./RupturantsSection";
import { StatisticsSection } from "./StatisticsSection";
import type { BaseSectionProps, SegmentSectionProps } from "./types";

interface IdentificationSuiviSectionProps extends BaseSectionProps, SegmentSectionProps {
  defaultPeriod?: Period;
}

export function IdentificationSuiviSection({
  defaultPeriod = "30days",
  segment,
  isPublic = false,
  region,
  national = false,
}: IdentificationSuiviSectionProps) {
  const [period, setPeriod] = useState<Period>(defaultPeriod);
  const { data, isLoading, isFetching, error } = useTraitementStats({ period, segment, region });
  const { data: dossiersTraitesData } = useDossiersTraitesStats({ period, segment, region, national, isPublic });

  const loadingPercentage = isLoadingVariation(isFetching, isLoading);
  const hideDossiersTraites = dossiersTraitesData?.traites === 0;

  return (
    <StatisticsSection
      title="De l'identification au suivi"
      controls={<PeriodSelector value={period} onChange={setPeriod} includeAll={true} hideLabel={true} />}
      controlsPosition="below-left"
    >
      <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
        <div className={styles.cardsContainer}>
          <TraitementCards
            latestStats={data?.latest}
            firstStats={data?.first}
            loading={isLoading}
            loadingPercentage={loadingPercentage}
          />
        </div>
        <div className={hideDossiersTraites ? styles.chartsContainerFullWidth : styles.chartsContainer}>
          <RupturantsSection
            period={period}
            segment={segment}
            isPublic={isPublic}
            region={region}
            national={national}
          />
          {!hideDossiersTraites && (
            <DossiersTraitesSection
              period={period}
              segment={segment}
              isPublic={isPublic}
              region={region}
              national={national}
            />
          )}
        </div>
      </StatsErrorHandler>
    </StatisticsSection>
  );
}
