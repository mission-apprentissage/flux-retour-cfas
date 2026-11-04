"use client";

import { KpiFunnel, kpiFunnelCardClassName } from "../cards/KpiFunnel";
import { TraitementCards } from "../cards/TraitementCards";
import { isLoadingVariation } from "../hooks/useLoadingVariation";
import { useStatsFilters } from "../hooks/useStatsFilters";
import { useTraitementStats } from "../hooks/useStatsQueries";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import { OverviewSection } from "./OverviewSection";

export function RupturesOverviewSection() {
  const { period, scope } = useStatsFilters();
  const { data, isLoading, isFetching, error } = useTraitementStats({ period, segment: "rupture", ...scope });

  return (
    <OverviewSection title="Traitement et suivis des ruptures">
      <KpiFunnel title="De l'identification de la rupture au suivi">
        <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
          <TraitementCards
            latestStats={data?.latest}
            variations={data?.variations}
            loading={isLoading}
            loadingPercentage={isLoadingVariation(isFetching, isLoading)}
            cardClassName={kpiFunnelCardClassName}
          />
        </StatsErrorHandler>
      </KpiFunnel>
    </OverviewSection>
  );
}
