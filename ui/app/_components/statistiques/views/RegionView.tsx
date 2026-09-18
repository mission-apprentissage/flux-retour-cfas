"use client";

import { REGIONS_BY_CODE } from "shared/constants/territoires";

import { CollaborationSegmentPanel } from "../sections/CollaborationSegmentPanel";
import { RupturesSegmentPanel } from "../sections/RupturesSegmentPanel";
import { RegionSVG } from "../ui/RegionSVG";
import { StatsTabs } from "../ui/StatsTabs";
import { ViewHeader } from "../ui/ViewHeader";

import styles from "./RegionView.module.css";

interface RegionViewProps {
  regionCode: string;
  isAdmin?: boolean;
}

export function RegionView({ regionCode, isAdmin = false }: RegionViewProps) {
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

      <StatsTabs
        tabs={[
          {
            id: "ruptures",
            label: "Ruptures uniquement",
            content: (
              <RupturesSegmentPanel
                region={regionCode}
                isAdmin={isAdmin}
                suiviTraitement
                suiviTraitementTitle="Suivi traitement rupture"
              />
            ),
          },
          {
            id: "collaborations",
            label: "Collaborations",
            content: <CollaborationSegmentPanel region={regionCode} isAdmin={isAdmin} suiviTraitement />,
          },
        ]}
      />
    </div>
  );
}
