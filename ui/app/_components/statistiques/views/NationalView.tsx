"use client";

import Image from "next/image";

import { CollaborationSegmentPanel } from "../sections/CollaborationSegmentPanel";
import { CouvertureRegionsSection } from "../sections/CouvertureRegionsSection";
import { ExportAllButton } from "../sections/ExportAllButton";
import { RupturesSegmentPanel } from "../sections/RupturesSegmentPanel";
import { StatsTabs } from "../ui/StatsTabs";
import { ViewHeader } from "../ui/ViewHeader";

import styles from "./NationalView.module.css";

interface NationalViewProps {
  isAdmin?: boolean;
}

export function NationalView({ isAdmin = false }: NationalViewProps) {
  return (
    <div>
      <ViewHeader
        title="National"
        icon={<Image src="/france.png" alt="France" width={60} height={60} className={styles.franceLogo} />}
        action={<ExportAllButton />}
      />

      <StatsTabs
        tabs={[
          {
            id: "ruptures",
            label: "Ruptures uniquement",
            iconId: "fr-icon-file-text-line",
            content: <RupturesSegmentPanel national isAdmin={isAdmin} suiviTraitement />,
          },
          {
            id: "collaborations",
            label: "Collaborations",
            iconId: "fr-icon-team-line",
            content: <CollaborationSegmentPanel national isAdmin={isAdmin} suiviTraitement />,
          },
          {
            id: "deploiement",
            label: "Suivi déploiement",
            iconId: "fr-icon-line-chart-line",
            content: (
              <CouvertureRegionsSection
                isAdmin={isAdmin}
                national
                title="Déploiement et activité ML"
                note="Les dossiers à traiter et traités couvrent les ruptures et les collaborations."
              />
            ),
          },
        ]}
      />
    </div>
  );
}
