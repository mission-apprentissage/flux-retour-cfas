"use client";

import { useCollaborationsCfaPublic } from "../hooks/useStatsQueries";
import { CollaborationRegionTable } from "../tables/CollaborationRegionTable";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import { StatisticsSection } from "./StatisticsSection";

export function CollaborationsCfaSection() {
  const { data, isLoading, error } = useCollaborationsCfaPublic();

  return (
    <StatisticsSection title="Déploiement aux CFA">
      <p className="fr-text--sm fr-mb-2w">
        CFA compatibles avec la collaboration, dont ceux ayant créé un compte sur le Tableau de bord et ceux ayant déjà
        envoyé au moins un dossier à une Mission Locale. Les collaborations sont comptées depuis le 1er janvier 2026, à
        la date de réponse du CFA.
      </p>
      <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
        <CollaborationRegionTable
          regions={data?.regions.map((row) => ({ ...row, cfa_with_collab: { current: row.cfa_with_collab } }))}
          loading={isLoading}
        />
      </StatsErrorHandler>
    </StatisticsSection>
  );
}
