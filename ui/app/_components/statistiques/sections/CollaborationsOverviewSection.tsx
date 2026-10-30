"use client";

import { CollaborationCards } from "../cards/CollaborationCards";
import { KpiFunnel, kpiFunnelCardClassName } from "../cards/KpiFunnel";
import { isLoadingVariation } from "../hooks/useLoadingVariation";
import { useStatsFilters } from "../hooks/useStatsFilters";
import { useCollaborationSegmentStats, useCollaborationsCfaPublic } from "../hooks/useStatsQueries";
import { CollaborationRegionTable } from "../tables/CollaborationRegionTable";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import { CollaborationsCfaDescription } from "./CollaborationsCfaSection";
import { OverviewSection } from "./OverviewSection";

export function CollaborationsOverviewSection() {
  const { period, region, scope } = useStatsFilters();
  const { data, isLoading, isFetching, error } = useCollaborationSegmentStats({ period, ...scope });
  const { data: cfaData, isLoading: cfaLoading, error: cfaError } = useCollaborationsCfaPublic();

  const cfaRegions = cfaData?.regions
    .filter((row) => !region || row.region_code === region)
    .map((row) => ({ ...row, cfa_with_collab: { current: row.cfa_with_collab } }));

  return (
    <OverviewSection title="Collaborations entre CFA et Missions Locales">
      <KpiFunnel title="De l'envoi par le CFA au rendez-vous en Mission Locale">
        <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
          <CollaborationCards
            data={data}
            loading={isLoading}
            loadingPercentage={isLoadingVariation(isFetching, isLoading)}
            cardClassName={kpiFunnelCardClassName}
          />
        </StatsErrorHandler>
      </KpiFunnel>
      <StatsErrorHandler data={cfaData} error={cfaError} isLoading={cfaLoading}>
        <CollaborationsCfaDescription />
        <CollaborationRegionTable regions={cfaRegions} loading={cfaLoading} />
      </StatsErrorHandler>
    </OverviewSection>
  );
}
