"use client";

import { useStatsFilters } from "../hooks/useStatsFilters";

import { DeploymentContent } from "./DeploymentSection";
import { OverviewSection } from "./OverviewSection";

export function DeploymentOverviewSection() {
  const { period, region, departement } = useStatsFilters();

  return (
    <OverviewSection title="Déploiement Missions Locales">
      <DeploymentContent period={period} region={region} departement={departement} />
    </OverviewSection>
  );
}
