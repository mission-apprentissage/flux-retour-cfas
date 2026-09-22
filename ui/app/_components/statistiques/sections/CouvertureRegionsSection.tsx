"use client";

import { useState } from "react";

import { TableSkeleton } from "@/app/_components/common/Skeleton";

import { useCouvertureRegionsStats } from "../hooks/useStatsQueries";
import { useUserRegions } from "../hooks/useUserRegions";
import { NationalRegionTable } from "../tables/NationalRegionTable";
import { PeriodSelector, type Period } from "../ui/PeriodSelector";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import { StatisticsSection } from "./StatisticsSection";

interface CouvertureRegionsSectionProps {
  defaultPeriod?: Period;
  isAdmin?: boolean;
  national?: boolean;
  title?: string;
  note?: string;
}

export function CouvertureRegionsSection({
  defaultPeriod = "30days",
  isAdmin = false,
  national = false,
  title = "Couverture et activités en région",
  note,
}: CouvertureRegionsSectionProps) {
  const [period, setPeriod] = useState<Period>(defaultPeriod);
  const { data, isLoading, isFetching, error } = useCouvertureRegionsStats(period, national);
  const { regions: userRegions } = useUserRegions();
  const regions = data?.regions || [];
  const detailRegions = isAdmin ? regions.map((region) => region.code) : userRegions;

  const loadingDeltas = isFetching && !isLoading;

  return (
    <StatisticsSection
      title={title}
      controls={<PeriodSelector value={period} onChange={setPeriod} includeAll={true} hideLabel={true} />}
      controlsPosition="below-left"
    >
      {note && <p className="fr-text--sm fr-mb-2w">{note}</p>}
      <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
        <div>
          {isLoading ? (
            <TableSkeleton rows={6} />
          ) : (
            <NationalRegionTable regions={regions} loadingDeltas={loadingDeltas} detailRegions={detailRegions} />
          )}
        </div>
      </StatsErrorHandler>
    </StatisticsSection>
  );
}
