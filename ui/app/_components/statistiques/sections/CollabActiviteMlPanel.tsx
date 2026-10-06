"use client";

import { OverviewSection } from "./OverviewSection";
import { SuiviTraitementMLCard } from "./SuiviTraitementMLCard";

export function CollabActiviteMlPanel() {
  return (
    <OverviewSection title="Activité des Missions Locales en collaboration">
      <SuiviTraitementMLCard segment="collab" />
    </OverviewSection>
  );
}
