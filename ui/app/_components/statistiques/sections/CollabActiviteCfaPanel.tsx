"use client";

import { SegmentAboutText } from "../ui/SegmentAboutText";

import { CfaAlertesSection } from "./CfaAlertesSection";
import { CfaEtablissementsCard } from "./CfaEtablissementsCard";
import { CfaSatisfactionCard } from "./CfaSatisfactionCard";
import { OverviewSection } from "./OverviewSection";

export function CollabActiviteCfaPanel() {
  return (
    <OverviewSection title="Activité des CFA">
      <SegmentAboutText variant="collab" />
      <CfaEtablissementsCard />
      <CfaSatisfactionCard />
      <CfaAlertesSection injoignables />
    </OverviewSection>
  );
}
