"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { useState } from "react";

import { useTraitementExport } from "../hooks/useTraitementExport";

interface ExportAllButtonProps {
  region?: string;
  mlId?: string;
  mlNom?: string;
  label?: string;
  priority?: "primary" | "secondary";
}

export function ExportAllButton({
  region,
  mlId,
  mlNom,
  label = "Exporter toutes les données détaillées",
  priority = "primary",
}: ExportAllButtonProps) {
  const [exportError, setExportError] = useState<string | null>(null);
  const { exportData, isExporting } = useTraitementExport({
    region,
    mlId,
    mlNom,
    onError: (error) => setExportError(error.message),
    onSuccess: () => setExportError(null),
  });

  return (
    <>
      <Button
        iconId="fr-icon-download-line"
        iconPosition="right"
        priority={priority}
        onClick={exportData}
        disabled={isExporting}
      >
        {isExporting ? "Export en cours..." : label}
      </Button>
      {exportError && (
        <Alert
          severity="error"
          title="Erreur"
          description={exportError}
          closable
          onClose={() => setExportError(null)}
          small
        />
      )}
    </>
  );
}
