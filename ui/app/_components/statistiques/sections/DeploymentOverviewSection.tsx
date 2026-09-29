"use client";

import { useStatsFilters } from "../hooks/useStatsFilters";

import { DeploymentContent } from "./DeploymentSection";
import { OverviewSection } from "./OverviewSection";

export function DeploymentOverviewSection({ isAdmin = false }: { isAdmin?: boolean }) {
  const { period, region } = useStatsFilters();

  return (
    <OverviewSection title="Déploiement Missions Locales">
      <DeploymentContent period={period} region={region} isAdmin={isAdmin} />
    </OverviewSection>
  );
}
