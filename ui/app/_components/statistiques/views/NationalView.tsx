"use client";

import Image from "next/image";

import { AccompagnementConjointSection } from "../sections/AccompagnementConjointSection";
import { CouvertureRegionsSection } from "../sections/CouvertureRegionsSection";
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
      />

      <StatsTabs
        tabs={[
          {
            id: "ruptures",
            label: "Ruptures uniquement",
            content: <RupturesSegmentPanel national isAdmin={isAdmin} suiviTraitement />,
          },
          {
            id: "collaborations",
            label: "Collaborations",
            content: <AccompagnementConjointSection national />,
          },
          {
            id: "deploiement",
            label: "Suivi déploiement",
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
