"use client";

import { useState, type ReactNode } from "react";

import { DossiersTraitesSection } from "../../sections/DossiersTraitesSection";
import { RupturantsSection } from "../../sections/RupturantsSection";
import type { Period } from "../../ui/PeriodSelector";
import { PeriodSelector } from "../../ui/PeriodSelector";
import { SegmentAboutText } from "../../ui/SegmentAboutText";

import styles from "./MLSuiviTraitementTab.module.css";

interface MLSuiviTraitementTabProps {
  mlId: string;
  noData?: boolean;
  action?: ReactNode;
}

export function MLSuiviTraitementTab({ mlId, noData, action }: MLSuiviTraitementTabProps) {
  const [period, setPeriod] = useState<Period>("30days");

  return (
    <div className={styles.container}>
      {!noData && (
        <>
          <SegmentAboutText variant="rupture" />
          <div className={styles.periodRow}>
            <PeriodSelector value={period} onChange={setPeriod} includeAll={true} hideLabel={true} />
            {action}
          </div>
        </>
      )}

      <div className={styles.chartsContainer}>
        {!noData && (
          <RupturantsSection
            period={period}
            segment="rupture"
            mlId={mlId}
            fullWidth
            title="Jeunes identifiés en rupture"
          />
        )}
        <DossiersTraitesSection
          period={period}
          segment="rupture"
          mlId={mlId}
          fullWidth
          noData={noData}
          title="Dossiers en rupture traités"
        />
      </div>
    </div>
  );
}
