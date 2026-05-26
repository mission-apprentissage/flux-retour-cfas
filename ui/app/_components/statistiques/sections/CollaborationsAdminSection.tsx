"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useState } from "react";

import { useCollaborationExport } from "../hooks/useCollaborationExport";
import { useCollaborationStats } from "../hooks/useCollaborationStats";
import { CollaborationRegionTable } from "../tables/CollaborationRegionTable";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import { CollaborationActivationSection } from "./CollaborationActivationSection";
import styles from "./CollaborationsAdminSection.module.css";
import { CollaborationUsageSection } from "./CollaborationUsageSection";
import { StatisticsSection } from "./StatisticsSection";

export function CollaborationsAdminSection() {
  const { data, isLoading, error } = useCollaborationStats();
  const [exportError, setExportError] = useState<string | null>(null);
  const { exportData, isExporting } = useCollaborationExport({
    onError: (e) => setExportError(e.message),
    onSuccess: () => setExportError(null),
  });

  const exportButton = (
    <Button
      iconId="fr-icon-download-line"
      iconPosition="right"
      priority="secondary"
      onClick={exportData}
      disabled={isExporting}
    >
      {isExporting ? "Export en cours..." : "Exporter les données"}
    </Button>
  );

  return (
    <StatisticsSection title="Collaborations entre CFA et Missions Locales" controls={exportButton}>
      <p className={styles.description}>
        Chiffres cumulés depuis le lancement de la V2 avec la fonctionnalité de collaboration (1er janvier 2026).
      </p>
      {exportError && (
        <Alert
          severity="error"
          title="Erreur"
          description={exportError}
          closable
          onClose={() => setExportError(null)}
          className={styles.exportError}
        />
      )}
      <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
        <CollaborationActivationSection data={data} loading={isLoading} />
        <CollaborationRegionTable regions={data?.regions} loading={isLoading} />
        <CollaborationUsageSection data={data} loading={isLoading} />
      </StatsErrorHandler>
    </StatisticsSection>
  );
}
