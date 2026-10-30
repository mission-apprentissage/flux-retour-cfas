"use client";

import { KpiFunnel, kpiFunnelCardClassName } from "../cards/KpiFunnel";
import { StatCard } from "../cards/StatCard";
import { CFA_AVEC_COMPTE_DEFINITION, CFA_COMPATIBLES_DEFINITION } from "../constants";
import { isLoadingVariation } from "../hooks/useLoadingVariation";
import { useStatsFilters } from "../hooks/useStatsFilters";
import { useCfaAdoptionStats } from "../hooks/useStatsQueries";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

export function CfaAdoptionKpis() {
  const { period, scope } = useStatsFilters();
  const { data, isLoading, isFetching, error } = useCfaAdoptionStats(period, scope);

  return (
    <KpiFunnel title="Adoption des CFA">
      <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
        <StatCard
          label="Estimation du nombre de CFA sur le territoire"
          value={data?.estimation}
          loading={isLoading}
          className={kpiFunnelCardClassName}
        />
        <StatCard
          label="Total CFA compatibles avec la collaboration ML"
          value={data?.compatibles}
          loading={isLoading}
          className={kpiFunnelCardClassName}
          tooltip={CFA_COMPATIBLES_DEFINITION}
        />
        <StatCard
          label="Total CFA ayant créé un compte sur le Tableau de bord"
          value={data?.avec_compte.current}
          variation={data?.avec_compte.variation}
          loading={isLoading}
          loadingPercentage={isLoadingVariation(isFetching, isLoading)}
          className={kpiFunnelCardClassName}
          tooltip={CFA_AVEC_COMPTE_DEFINITION}
        />
        <StatCard
          label="Total CFA ayant envoyé au moins une collaboration à une Mission Locale"
          value={data?.avec_collaboration.current}
          variation={data?.avec_collaboration.variation}
          loading={isLoading}
          loadingPercentage={isLoadingVariation(isFetching, isLoading)}
          className={kpiFunnelCardClassName}
        />
      </StatsErrorHandler>
    </KpiFunnel>
  );
}
