"use client";

import { REGIONS_BY_CODE } from "shared/constants/territoires";

import { AccompagnementConjointSection } from "../sections/AccompagnementConjointSection";
import { IdentificationSuiviSection } from "../sections/IdentificationSuiviSection";
import { SuiviTraitementSection } from "../sections/SuiviTraitementSection";
import { RegionSVG } from "../ui/RegionSVG";
import { ViewHeader } from "../ui/ViewHeader";

import styles from "./RegionView.module.css";

interface RegionViewProps {
  regionCode: string;
  isAdmin?: boolean;
}

export function RegionView({ regionCode, isAdmin = true }: RegionViewProps) {
  const region = REGIONS_BY_CODE[regionCode as keyof typeof REGIONS_BY_CODE];
  const regionName = region?.nom || "Région inconnue";

  return (
    <div>
      <ViewHeader
        title={regionName}
        icon={
          <div className={styles.mapContainer}>
            <RegionSVG regionCode={regionCode} fill="#6A6AF4" />
          </div>
        }
      />

      <IdentificationSuiviSection region={regionCode} />

      <SuiviTraitementSection region={regionCode} isAdmin={isAdmin} />
      <AccompagnementConjointSection region={regionCode} />
    </div>
  );
}
