"use client";

import { CollaborationCards } from "../cards/CollaborationCards";
import { KpiFunnel, kpiFunnelCardClassName } from "../cards/KpiFunnel";
import { isLoadingVariation } from "../hooks/useLoadingVariation";
import { useStatsFilters } from "../hooks/useStatsFilters";
import { useCollaborationSegmentStats } from "../hooks/useStatsQueries";
import { SegmentAboutText } from "../ui/SegmentAboutText";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import styles from "./CollabChiffresClesPanel.module.css";
import { CollabObjectifsBlock, CollabResultatsBlock, CollabSituationsBlock } from "./CollaborationChartBlocks";
import { OverviewSection } from "./OverviewSection";

export function CollabChiffresClesPanel() {
  const { period, scope } = useStatsFilters();
  const { data, isLoading, isFetching, error } = useCollaborationSegmentStats({ period, ...scope });
  const loadingVariation = isLoadingVariation(isFetching, isLoading);

  return (
    <OverviewSection title="Chiffres clés">
      <SegmentAboutText variant="collab" />
      <KpiFunnel title="De l'envoi par le CFA au rendez-vous en Mission Locale">
        <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
          <CollaborationCards
            data={data}
            loading={isLoading}
            loadingPercentage={loadingVariation}
            cardClassName={kpiFunnelCardClassName}
          />
        </StatsErrorHandler>
      </KpiFunnel>
      {data && (
        <>
          <h3 className={styles.subtitle}>Nature des dossiers envoyés par les CFA</h3>
          <CollabSituationsBlock data={data} loading={isLoading} variant="overview" />
          <CollabObjectifsBlock data={data} loading={isLoading} variant="overview" />
          <h3 className={styles.subtitle}>Résultats du traitement des dossiers par les Missions Locales</h3>
          <CollabResultatsBlock
            data={data}
            loading={isLoading}
            loadingVariation={loadingVariation}
            variant="overview"
          />
        </>
      )}
    </OverviewSection>
  );
}
