"use client";

import { useAuth } from "@/app/_context/UserContext";
import { isAdminUser } from "@/app/suivi-des-indicateurs/access";

import { MlCollabAlertesSection } from "./MlAlertesSection";
import { OverviewSection } from "./OverviewSection";
import { SuiviTraitementMLCard } from "./SuiviTraitementMLCard";

export function CollabActiviteMlPanel() {
  const { user } = useAuth();

  return (
    <OverviewSection title="Activité des Missions Locales en collaboration">
      <SuiviTraitementMLCard segment="collab" />
      {isAdminUser(user ?? null) && <MlCollabAlertesSection />}
    </OverviewSection>
  );
}
