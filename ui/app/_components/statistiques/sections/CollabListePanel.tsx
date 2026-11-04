"use client";

import { CollaborationsListCard } from "./CollaborationsListCard";
import { OverviewSection } from "./OverviewSection";

export function CollabListePanel() {
  return (
    <OverviewSection title="Liste des collaborations partagées entre CFA et Missions Locales">
      <CollaborationsListCard />
    </OverviewSection>
  );
}
