"use client";

import { useAuth } from "@/app/_context/UserContext";
import { isAdminUser } from "@/app/suivi-des-indicateurs/access";

import { CollaborationCards } from "../cards/CollaborationCards";
import { KpiFunnel, kpiFunnelCardClassName } from "../cards/KpiFunnel";
import { OverviewCard } from "../cards/OverviewCard";
import { CollabMensuelChart } from "../charts/CollabMensuelChart";
import { isLoadingVariation } from "../hooks/useLoadingVariation";
import { useStatsFilters } from "../hooks/useStatsFilters";
import { useCollaborationMensuelStats, useCollaborationSegmentStats } from "../hooks/useStatsQueries";
import { SegmentAboutText } from "../ui/SegmentAboutText";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import styles from "./CollabChiffresClesPanel.module.css";
import { CollabCorrelationsSection } from "./CollabCorrelationsSection";
import { CollabObjectifsBlock, CollabResultatsBlock, CollabSituationsBlock } from "./CollaborationChartBlocks";
import { OverviewSection } from "./OverviewSection";

export function CollabChiffresClesPanel() {
  const { period, scope } = useStatsFilters();
  const { data, isLoading, isFetching, error } = useCollaborationSegmentStats({ period, ...scope });
  const loadingVariation = isLoadingVariation(isFetching, isLoading);
  const mensuel = useCollaborationMensuelStats({ period, ...scope });
  const { user } = useAuth();

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
      <OverviewCard title="Évolution mensuelle">
        <StatsErrorHandler data={mensuel.data} error={mensuel.error} isLoading={mensuel.isLoading}>
          <CollabMensuelChart data={mensuel.data?.mois} loading={mensuel.isLoading} />
        </StatsErrorHandler>
      </OverviewCard>
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
      {isAdminUser(user ?? null) && <CollabCorrelationsSection titreClassName={styles.subtitle} />}
    </OverviewSection>
  );
}
