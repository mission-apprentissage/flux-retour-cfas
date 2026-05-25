"use client";

import { useCollaborationStats } from "../hooks/useCollaborationStats";
import { CollaborationRegionTable } from "../tables/CollaborationRegionTable";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import { CollaborationActivationSection } from "./CollaborationActivationSection";
import styles from "./CollaborationsAdminSection.module.css";
import { CollaborationUsageSection } from "./CollaborationUsageSection";
import { StatisticsSection } from "./StatisticsSection";

export function CollaborationsAdminSection() {
  const { data, isLoading, error } = useCollaborationStats();

  return (
    <StatisticsSection title="Collaborations entre CFA et Missions Locales">
      <p className={styles.description}>
        Chiffres cumulés depuis le lancement de la V2 avec la fonctionnalité de collaboration (1er janvier 2026).
      </p>
      <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
        <CollaborationActivationSection data={data} loading={isLoading} />
        <CollaborationRegionTable regions={data?.regions} loading={isLoading} />
        <CollaborationUsageSection data={data} loading={isLoading} />
      </StatsErrorHandler>
    </StatisticsSection>
  );
}
