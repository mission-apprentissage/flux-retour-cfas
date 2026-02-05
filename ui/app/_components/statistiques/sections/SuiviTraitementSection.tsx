"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { useState } from "react";
import { ORGANISATION_TYPE } from "shared";

import useAuth from "@/hooks/useAuth";

import { useTraitementExport } from "../hooks/useTraitementExport";
import { TraitementMLTable } from "../tables/TraitementMLTable";
import { TraitementRegionTable } from "../tables/TraitementRegionTable";
import { PeriodSelector, type Period } from "../ui/PeriodSelector";

import { StatisticsSection } from "./StatisticsSection";
import styles from "./StatisticsSection.module.css";

interface SuiviTraitementSectionProps {
  defaultPeriod?: Period;
  region?: string;
  isAdmin?: boolean;
  national?: boolean;
}

export function SuiviTraitementSection({
  defaultPeriod = "30days",
  region,
  isAdmin = true,
  national = false,
}: SuiviTraitementSectionProps) {
  const [period, setPeriod] = useState<Period>(defaultPeriod);
  const [exportError, setExportError] = useState<string | null>(null);
  const { organisationType } = useAuth();

  const canExport = organisationType !== ORGANISATION_TYPE.DREETS && organisationType !== ORGANISATION_TYPE.DDETS;

  const { exportData, isExporting } = useTraitementExport({
    region,
    onError: (error) => setExportError(error.message),
    onSuccess: () => setExportError(null),
  });

  const controls = (
    <div className={styles.controlsWrapper}>
      <PeriodSelector value={period} onChange={setPeriod} includeAll={true} hideLabel={true} />
      {canExport && (
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
      <StatisticsSection title="Suivi traitement" controls={controls} controlsPosition="below-left">
        {errorAlert}
        <TraitementMLTable period={period} region={region} isAdmin={isAdmin} />
      </StatisticsSection>
    );
  }

  if (!isAdmin) {
    return (
      <StatisticsSection title="Suivi traitement" controls={controls} controlsPosition="below-left">
        {errorAlert}
        <TraitementRegionTable period={period} national={national} />
      </StatisticsSection>
    );
  }

  return (
    <StatisticsSection title="Suivi traitement" controls={controls} controlsPosition="below-left">
      {errorAlert}
      <Tabs
        className={styles.tabsContainer}
        tabs={[
          {
            label: "Par Mission Locale",
            content: <TraitementMLTable period={period} isAdmin={isAdmin} />,
          },
          {
            label: "Par région",
            content: <TraitementRegionTable period={period} national={national} />,
          },
        ]}
      />
    </StatisticsSection>
  );
}
