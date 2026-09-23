"use client";

import { SegmentAboutText } from "../ui/SegmentAboutText";

import { IdentificationSuiviSection } from "./IdentificationSuiviSection";
import { SuiviTraitementSection } from "./SuiviTraitementSection";

interface RupturesSegmentPanelProps {
  region?: string;
  national?: boolean;
  isPublic?: boolean;
  isAdmin?: boolean;
  suiviTraitement?: boolean;
  suiviTraitementTitle?: string;
}

export function RupturesSegmentPanel({
  region,
  national = false,
  isPublic = false,
  isAdmin = false,
  suiviTraitement = false,
  suiviTraitementTitle = "Suivi traitement",
}: RupturesSegmentPanelProps) {
  return (
    <div>
      <IdentificationSuiviSection
        segment="rupture"
        isPublic={isPublic}
        region={region}
        national={national}
        description={<SegmentAboutText variant="rupture" />}
      />
      {suiviTraitement && (
        <SuiviTraitementSection
          segment="rupture"
          title={suiviTraitementTitle}
          region={region}
          isAdmin={isAdmin}
          national={national}
        />
      )}
    </div>
  );
}
