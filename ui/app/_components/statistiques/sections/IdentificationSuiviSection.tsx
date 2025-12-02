"use client";

import { useState } from "react";

import { TraitementCards } from "../cards/TraitementCards";
import { isLoadingVariation } from "../hooks/useLoadingVariation";
import { useTraitementStats } from "../hooks/useStatsQueries";
import { PeriodSelector, type Period } from "../ui/PeriodSelector";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import { DossiersTraitesSection } from "./DossiersTraitesSection";
import styles from "./IdentificationSuiviSection.module.css";
import { RupturantsSection } from "./RupturantsSection";
import { StatisticsSection } from "./StatisticsSection";
import type { BaseSectionProps } from "./types";

interface IdentificationSuiviSectionProps extends BaseSectionProps {
  defaultPeriod?: Period;
  showCharts?: boolean;
  hideDossiersTraites?: boolean;
}

export function IdentificationSuiviSection({
  defaultPeriod = "30days",
  showCharts = true,
  region,
  hideDossiersTraites = false,
  national = false,
}: IdentificationSuiviSectionProps) {
  const [period, setPeriod] = useState<Period>(defaultPeriod);
  const { data, isLoading, isFetching, error } = useTraitementStats(period, region);

  const loadingPercentage = isLoadingVariation(isFetching, isLoading);

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
        {showCharts && (
          <div className={hideDossiersTraites ? styles.chartsContainerFullWidth : styles.chartsContainer}>
            <RupturantsSection period={period} region={region} national={national} />
            {!hideDossiersTraites && <DossiersTraitesSection period={period} region={region} national={national} />}
          </div>
        )}
      </StatsErrorHandler>
    </StatisticsSection>
  );
}
