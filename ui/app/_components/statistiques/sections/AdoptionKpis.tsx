"use client";

import { KpiFunnel, kpiFunnelCardClassName } from "../cards/KpiFunnel";
import { StatCard } from "../cards/StatCard";
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
          tooltip="Ensemble des Missions Locales recensées dans le Tableau de bord sur le territoire sélectionné."
        />
        <StatCard
          label="Missions Locales actives sur le Tableau de bord"
          value={summary?.activatedMlCount}
          variation={summary?.activatedMlVariation}
          loading={isLoading}
          loadingPercentage={loadingPercentage}
          className={kpiFunnelCardClassName}
          tooltip="Missions Locales dont l'accès au suivi des jeunes a été activé sur le Tableau de bord à la date d'évaluation."
        />
        <StatCard
          label="Missions Locales engagées sur le Tableau de bord"
          value={summary?.engagedMlCount}
          variation={summary?.engagedMlVariation}
          loading={isLoading}
          loadingPercentage={loadingPercentage}
          className={kpiFunnelCardClassName}
          tooltip="Les Missions Locales sont considérées comme engagées sur l'utilisation du service du Tableau de bord de l'apprentissage à partir d'un taux de dossiers traités supérieur ou égal à 70%."
        />
      </StatsErrorHandler>
    </KpiFunnel>
  );
}
