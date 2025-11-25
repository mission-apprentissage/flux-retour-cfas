"use client";

import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import type { StatsPeriod } from "shared/models/data/nationalStats.model";

import { StatisticsSection } from "./StatisticsSection";
import styles from "./StatisticsSection.module.css";
import { TraitementMLTable } from "./TraitementMLTable";
import { TraitementRegionTable } from "./TraitementRegionTable";

interface SuiviTraitementSectionProps {
  period: StatsPeriod;
}

export function SuiviTraitementSection({ period }: SuiviTraitementSectionProps) {
  return (
    <StatisticsSection title="Suivi traitement">
      <Tabs
        className={styles.tabsContainer}
        tabs={[
          {
            label: "Par Mission Locale",
            content: <TraitementMLTable period={period} />,
          },
          {
            label: "Par région",
            content: <TraitementRegionTable period={period} />,
          },
        ]}
      />
    </StatisticsSection>
  );
}
