"use client";

import { KpiFunnel, kpiFunnelCardClassName } from "../cards/KpiFunnel";
import { StatCard } from "../cards/StatCard";
import { ML_ACTIVES_DEFINITION, ML_ENGAGEES_DEFINITION } from "../constants";
import { isLoadingVariation } from "../hooks/useLoadingVariation";
import { useStatsFilters } from "../hooks/useStatsFilters";
import { useDeploymentStats } from "../hooks/useStatsQueries";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

export function AdoptionKpis() {
  const { period, region, departement } = useStatsFilters();
  const { data, isLoading, isFetching, error } = useDeploymentStats(period, region, departement);
  const summary = data?.summary;
  const loadingPercentage = isLoadingVariation(isFetching, isLoading);

  return (
    <KpiFunnel title="Adoption des Missions Locales">
      <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
        <StatCard
          label="Total Missions locales sur le territoire"
          value={summary?.mlCount}
          loading={isLoading}
          className={kpiFunnelCardClassName}
        />
        <StatCard
          label="Missions Locales actives sur le Tableau de bord"
          value={summary?.activatedMlCount}
          variation={summary?.activatedMlVariation}
          loading={isLoading}
          loadingPercentage={loadingPercentage}
          className={kpiFunnelCardClassName}
          tooltip={`${ML_ACTIVES_DEFINITION}.`}
        />
        <StatCard
          label="Missions Locales engagées sur le Tableau de bord"
          value={summary?.engagedMlCount}
          variation={summary?.engagedMlVariation}
          loading={isLoading}
          loadingPercentage={loadingPercentage}
          className={kpiFunnelCardClassName}
          tooltip={`${ML_ENGAGEES_DEFINITION}.`}
        />
      </StatsErrorHandler>
    </KpiFunnel>
  );
}
