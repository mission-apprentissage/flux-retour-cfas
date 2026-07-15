"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import mime from "mime";
import { useState } from "react";

import { Spinner } from "@/app/_components/common/Spinner";
import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import { _getBlob } from "@/common/httpClient";
import { downloadObject } from "@/common/utils/browser";

interface CfaSuiviExportButtonProps {
  organismeId: string;
}

export function CfaSuiviExportButton({ organismeId }: CfaSuiviExportButtonProps) {
  const [isFetching, setIsFetching] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  const onDownload = async () => {
    setIsFetching(true);
    setDownloadError(null);
    try {
      const { data } = await _getBlob(`/api/v1/organismes/${organismeId}/cfa/suivi-mission-locale/export`);
      const fileName = `Suivi_Missions_Locales_TBA_${new Date().toISOString().split("T")[0]}.xlsx`;
      trackPlausibleEvent("cfa_suivi_ml_export");
      downloadObject(data, fileName, mime.getType("xlsx") ?? "text/plain");
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      setDownloadError("Une erreur est survenue lors du téléchargement. Veuillez réessayer.");
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <>
      <Button
        disabled={isFetching}
        iconId="ri-download-line"
        iconPosition="right"
        onClick={onDownload}
        priority="secondary"
        aria-busy={isFetching}
        aria-label={isFetching ? "Téléchargement en cours..." : "Exporter les dossiers suivis"}
      >
        {isFetching && <Spinner size="1em" style={{ marginRight: "0.5rem" }} />}
        Exporter les dossiers suivis
      </Button>
      {downloadError && (
        <Alert
          closable
          description={downloadError}
          onClose={() => setDownloadError(null)}
          severity="error"
          title="Une erreur s'est produite"
          classes={{ root: "fr-mt-2w" }}
        />
      )}
    </>
  );
}
