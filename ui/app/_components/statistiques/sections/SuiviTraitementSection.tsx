"use client";

import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import type { StatsPeriod } from "shared/models/data/nationalStats.model";

import { TraitementMLTable } from "../tables/TraitementMLTable";
import { TraitementRegionTable } from "../tables/TraitementRegionTable";

import { StatisticsSection } from "./StatisticsSection";
import styles from "./StatisticsSection.module.css";

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
