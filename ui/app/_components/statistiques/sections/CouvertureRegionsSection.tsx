"use client";

import { useState } from "react";

import { useCouvertureRegionsStats } from "../hooks/useStatsQueries";
import { NationalRegionTable } from "../tables/NationalRegionTable";
import { PeriodSelector, type Period } from "../ui/PeriodSelector";
import { TableSkeleton } from "../ui/Skeleton";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import { StatisticsSection } from "./StatisticsSection";

interface CouvertureRegionsSectionProps {
  defaultPeriod?: Period;
  isAdmin?: boolean;
}

export function CouvertureRegionsSection({ defaultPeriod = "30days", isAdmin = false }: CouvertureRegionsSectionProps) {
  const [period, setPeriod] = useState<Period>(defaultPeriod);
  const { data, isLoading, isFetching, error } = useCouvertureRegionsStats(period);

  const loadingDeltas = isFetching && !isLoading;

  return (
    <StatisticsSection
      title="Couverture et activités en région"
      controls={<PeriodSelector value={period} onChange={setPeriod} includeAll={true} hideLabel={true} />}
      controlsPosition="below-left"
    >
      <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
        <div>
          {isLoading ? (
            <TableSkeleton rows={6} />
          ) : (
            <NationalRegionTable regions={data?.regions || []} loadingDeltas={loadingDeltas} isAdmin={isAdmin} />
          )}
        </div>
      </StatsErrorHandler>
    </StatisticsSection>
  );
}
