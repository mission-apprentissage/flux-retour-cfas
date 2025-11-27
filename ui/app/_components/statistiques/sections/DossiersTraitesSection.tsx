"use client";

import { DetailsDossiersTraitesPieChart } from "../charts/DetailsDossiersTraitesPieChart";
import { useDossiersTraitesStats } from "../hooks/useStatsQueries";
import type { Period } from "../ui/PeriodSelector";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import { StatisticsSection } from "./StatisticsSection";

interface DossiersTraitesSectionProps {
  period?: Period;
}

export function DossiersTraitesSection({ period = "30days" }: DossiersTraitesSectionProps) {
  const { data, isLoading, error } = useDossiersTraitesStats(period);

  return (
    <StatisticsSection title="Dossiers traités" width="two-thirds" smallTitle>
      <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
        <DetailsDossiersTraitesPieChart data={data?.details} loading={isLoading} />
      </StatsErrorHandler>
    </StatisticsSection>
  );
}
