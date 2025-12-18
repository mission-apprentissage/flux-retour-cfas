"use client";

import { useState } from "react";

import { AccompagnementConjointSection } from "../../sections/AccompagnementConjointSection";
import { DossiersTraitesSection } from "../../sections/DossiersTraitesSection";
import { RupturantsSection } from "../../sections/RupturantsSection";
import type { Period } from "../../ui/PeriodSelector";
import { PeriodSelector } from "../../ui/PeriodSelector";

import styles from "./MLSuiviTraitementTab.module.css";

interface MLSuiviTraitementTabProps {
  mlId: string;
  noData?: boolean;
  hasCfaCollaboration?: boolean;
}

export function MLSuiviTraitementTab({ mlId, noData, hasCfaCollaboration }: MLSuiviTraitementTabProps) {
  const [period, setPeriod] = useState<Period>("30days");

  return (
    <div className={styles.container}>
      {!noData && (
        <div className={styles.periodSelectorContainer}>
          <PeriodSelector value={period} onChange={setPeriod} includeAll={true} hideLabel={true} />
        </div>
      )}

      <div className={styles.chartsContainer}>
        {!noData && <RupturantsSection period={period} mlId={mlId} fullWidth />}
        <DossiersTraitesSection period={period} mlId={mlId} fullWidth noData={noData} />
        {hasCfaCollaboration && <AccompagnementConjointSection mlId={mlId} compact noData={noData} />}
      </div>
    </div>
  );
}
