"use client";

import { useState } from "react";

import { CollaborationCards } from "../cards/CollaborationCards";
import { isLoadingVariation } from "../hooks/useLoadingVariation";
import { useCollaborationSegmentStats } from "../hooks/useStatsQueries";
import { NoDataMessage } from "../ui/NoDataMessage";
import { PeriodSelector, type Period } from "../ui/PeriodSelector";
import { SegmentAboutText } from "../ui/SegmentAboutText";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import { CollabObjectifsBlock, CollabResultatsBlock, CollabSituationsBlock } from "./CollaborationChartBlocks";
import styles from "./CollaborationSegmentPanel.module.css";
import { StatisticsSection } from "./StatisticsSection";
import { SuiviTraitementSection } from "./SuiviTraitementSection";

interface CollaborationSegmentPanelProps {
  region?: string;
  mlId?: string;
  national?: boolean;
  isPublic?: boolean;
  isAdmin?: boolean;
  suiviTraitement?: boolean;
  suiviTraitementTitle?: string;
}

export function CollaborationSegmentPanel({
  region,
  mlId,
  national = false,
  isPublic = false,
  isAdmin = false,
  suiviTraitement = false,
  suiviTraitementTitle = "Suivi traitement collaboration",
}: CollaborationSegmentPanelProps) {
  const [period, setPeriod] = useState<Period>("30days");
  const { data, isLoading, isFetching, error } = useCollaborationSegmentStats({
    period,
    region,
    mlId,
    national,
    isPublic,
  });
  const loadingVariation = isLoadingVariation(isFetching, isLoading);
  const hasNoCollab = !!mlId && !!data && data.objectifs.total_dossiers === 0;

  return (
    <div>
      <StatisticsSection
        title="De l'envoi par le CFA au rendez-vous en Mission Locale"
        description={<SegmentAboutText variant="collab" />}
        controls={<PeriodSelector value={period} onChange={setPeriod} includeAll={true} hideLabel={true} />}
        controlsPosition="below-left"
      >
        <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
          {hasNoCollab ? (
            <NoDataMessage message="Aucun dossier de collaboration n'a encore été envoyé à cette Mission Locale." />
          ) : (
            <div className={styles.cards}>
              <CollaborationCards data={data} loading={isLoading} loadingPercentage={loadingVariation} />
            </div>
          )}
        </StatsErrorHandler>
      </StatisticsSection>

      {data && !hasNoCollab && (
        <>
          <StatisticsSection title="Résultats du traitement des dossiers par les Missions Locales">
            <CollabResultatsBlock data={data} loading={isLoading} loadingVariation={loadingVariation} />
          </StatisticsSection>

          <StatisticsSection title="Nature des dossiers envoyés par les CFA">
            <CollabSituationsBlock data={data} loading={isLoading} />
            <CollabObjectifsBlock data={data} loading={isLoading} className={styles.chartCardSpaced} />
          </StatisticsSection>
        </>
      )}

      {suiviTraitement && (
        <SuiviTraitementSection
          segment="collab"
          title={suiviTraitementTitle}
          region={region}
          isAdmin={isAdmin}
          national={national}
        />
      )}
    </div>
  );
}
