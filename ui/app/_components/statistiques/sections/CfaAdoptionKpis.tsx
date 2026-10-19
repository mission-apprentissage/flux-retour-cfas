"use client";

import { KpiFunnel, kpiFunnelCardClassName } from "../cards/KpiFunnel";
import { StatCard } from "../cards/StatCard";
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
          tooltip="Source : référentiel ONISEP des organismes de formation. Établissements présents dans le référentiel, non fermés, toutes natures confondues, sur le territoire sélectionné."
        />
        <StatCard
          label="Total CFA compatibles avec la collaboration ML"
          value={data?.compatibles}
          loading={isLoading}
          className={kpiFunnelCardClassName}
          tooltip="CFA avec un SIRET et un UAI, de nature formateur, non fermés et transmettant au moins un effectif sur les années scolaires en cours."
        />
        <StatCard
          label="Total CFA ayant créé un compte sur le Tableau de bord"
          value={data?.avec_compte}
          loading={isLoading}
          className={kpiFunnelCardClassName}
          tooltip="CFA dont au moins un utilisateur a un compte confirmé sur le Tableau de bord, qu'ils soient compatibles avec la collaboration ou non."
        />
        <StatCard
          label="Total CFA ayant envoyé au moins une collaboration à une Mission Locale"
          value={data?.avec_collaboration.current}
          variation={data?.avec_collaboration.variation}
          loading={isLoading}
          loadingPercentage={isLoadingVariation(isFetching, isLoading)}
          className={kpiFunnelCardClassName}
          tooltip="CFA ayant envoyé au moins un dossier de collaboration à une Mission Locale, depuis le lancement de la collaboration."
        />
      </StatsErrorHandler>
    </KpiFunnel>
  );
}
