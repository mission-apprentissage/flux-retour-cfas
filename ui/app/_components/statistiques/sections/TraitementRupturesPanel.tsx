"use client";

import { KpiFunnel, kpiFunnelCardClassName } from "../cards/KpiFunnel";
import { TraitementCards } from "../cards/TraitementCards";
import { isLoadingVariation } from "../hooks/useLoadingVariation";
import { useStatsFilters } from "../hooks/useStatsFilters";
import { useTraitementStats } from "../hooks/useStatsQueries";
import { SegmentAboutText } from "../ui/SegmentAboutText";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import { DossiersTraitesSection } from "./DossiersTraitesSection";
import { OverviewSection } from "./OverviewSection";
import { RupturantsSection } from "./RupturantsSection";
import styles from "./TraitementRupturesPanel.module.css";

export function TraitementRupturesPanel() {
  const { period, scope } = useStatsFilters();
  const { data, isLoading, isFetching, error } = useTraitementStats({ period, segment: "rupture", ...scope });

  return (
    <OverviewSection title="Traitement et suivis des ruptures">
      <SegmentAboutText variant="rupture" />
      <KpiFunnel title="De l'identification de la rupture au suivi">
        <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
          <TraitementCards
            latestStats={data?.latest}
            firstStats={data?.first}
            loading={isLoading}
            loadingPercentage={isLoadingVariation(isFetching, isLoading)}
            cardClassName={kpiFunnelCardClassName}
          />
        </StatsErrorHandler>
      </KpiFunnel>
      <div className={styles.charts}>
        <RupturantsSection period={period} segment="rupture" title="Jeune en rupture identifié" {...scope} />
        <DossiersTraitesSection period={period} segment="rupture" title="Dossiers de rupture traités" {...scope} />
      </div>
    </OverviewSection>
  );
}
