"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { useState } from "react";
import type { StatsSegment } from "shared/models/data/nationalStats.model";

import { useTraitementExport } from "../hooks/useTraitementExport";
import { TraitementMLTable } from "../tables/TraitementMLTable";
import { TraitementRegionTable } from "../tables/TraitementRegionTable";
import { PeriodSelector, type Period } from "../ui/PeriodSelector";

import { StatisticsSection } from "./StatisticsSection";
import styles from "./StatisticsSection.module.css";

interface SuiviTraitementSectionProps {
  defaultPeriod?: Period;
  segment: StatsSegment;
  title?: string;
  region?: string;
  isAdmin?: boolean;
  national?: boolean;
  exportable?: boolean;
}

export function SuiviTraitementSection({
  defaultPeriod = "30days",
  segment,
  title = "Suivi traitement",
  region,
  isAdmin = false,
  national = false,
  exportable = true,
}: SuiviTraitementSectionProps) {
  const [period, setPeriod] = useState<Period>(defaultPeriod);
  const [exportError, setExportError] = useState<string | null>(null);
  const { exportData, isExporting } = useTraitementExport({
    region,
    onError: (error) => setExportError(error.message),
    onSuccess: () => setExportError(null),
  });

  const controls = (
    <div className={styles.controlsWrapper}>
      <PeriodSelector value={period} onChange={setPeriod} includeAll={true} hideLabel={true} />
      {exportable && (
        <Button
          iconId="fr-icon-download-line"
          iconPosition="right"
          priority="primary"
          onClick={exportData}
          disabled={isExporting}
        >
          {isExporting ? "Export en cours..." : "Exporter les données"}
        </Button>
      )}
    </div>
  );

  const errorAlert = exportError ? (
    <Alert
      severity="error"
      title="Erreur"
      description={exportError}
      closable
      onClose={() => setExportError(null)}
      className={styles.exportError}
    />
  ) : null;

  if (region) {
    return (
      <StatisticsSection title={title} controls={controls} controlsPosition="below-left">
        {errorAlert}
        <TraitementMLTable period={period} segment={segment} region={region} isAdmin={isAdmin} />
      </StatisticsSection>
    );
  }

  if (!isAdmin) {
    return (
      <StatisticsSection title={title} controls={controls} controlsPosition="below-left">
        {errorAlert}
        <TraitementRegionTable period={period} segment={segment} national={national} />
      </StatisticsSection>
    );
  }

  return (
    <StatisticsSection title={title} controls={controls} controlsPosition="below-left">
      {errorAlert}
      <Tabs
        className={styles.tabsContainer}
        tabs={[
          {
            label: "Par Mission Locale",
            content: <TraitementMLTable period={period} segment={segment} isAdmin={isAdmin} />,
          },
          {
            label: "Par région",
            content: <TraitementRegionTable period={period} segment={segment} national={national} />,
          },
        ]}
      />
    </StatisticsSection>
  );
}
