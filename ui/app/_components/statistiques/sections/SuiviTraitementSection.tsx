"use client";

import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { useState } from "react";

import { TraitementMLTable } from "../tables/TraitementMLTable";
import { TraitementRegionTable } from "../tables/TraitementRegionTable";
import { PeriodSelector, type Period } from "../ui/PeriodSelector";

import { StatisticsSection } from "./StatisticsSection";
import styles from "./StatisticsSection.module.css";

interface SuiviTraitementSectionProps {
  defaultPeriod?: Period;
  region?: string;
}

export function SuiviTraitementSection({ defaultPeriod = "30days", region }: SuiviTraitementSectionProps) {
  const [period, setPeriod] = useState<Period>(defaultPeriod);

  if (region) {
    return (
      <StatisticsSection
        title="Suivi traitement"
        controls={<PeriodSelector value={period} onChange={setPeriod} includeAll={true} hideLabel={true} />}
        controlsPosition="below-left"
      >
        <TraitementMLTable period={period} region={region} />
      </StatisticsSection>
    );
  }

  return (
    <StatisticsSection
      title="Suivi traitement"
      controls={<PeriodSelector value={period} onChange={setPeriod} includeAll={true} hideLabel={true} />}
      controlsPosition="below-left"
    >
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
