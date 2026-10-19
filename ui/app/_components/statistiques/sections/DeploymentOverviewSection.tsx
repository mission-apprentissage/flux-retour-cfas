"use client";

import { useStatsFilters } from "../hooks/useStatsFilters";

import { DeploymentContent } from "./DeploymentSection";
import { OverviewSection } from "./OverviewSection";

export function DeploymentOverviewSection() {
  const { period, region } = useStatsFilters();

  return (
    <OverviewSection title="Déploiement Missions Locales">
      <DeploymentContent period={period} region={region} />
    </OverviewSection>
  );
}
