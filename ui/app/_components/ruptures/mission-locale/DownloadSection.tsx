"use client";

import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import mime from "mime";
import qs from "qs";
import { useState } from "react";
import { API_EFFECTIF_LISTE, IMissionLocaleEffectifList } from "shared";

import { Spinner } from "@/app/_components/common/Spinner";
import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import { _getBlob } from "@/common/httpClient";
import { downloadObject } from "@/common/utils/browser";

type DownloadSectionProps = {
  listType: IMissionLocaleEffectifList;
};

export function DownloadSection({ listType }: DownloadSectionProps) {
  const [isFetching, setIsFetching] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  const getLabels = () => {
    switch (listType) {
      case API_EFFECTIF_LISTE.A_TRAITER:
        return {
          downloadText: "à traiter",
          buttonLabel: "Liste des jeunes à traiter",
        };
      case API_EFFECTIF_LISTE.INJOIGNABLE:
        return {
          downloadText: "à recontacter",
          buttonLabel: "Liste des jeunes à recontacter",
        };
      case API_EFFECTIF_LISTE.TRAITE:
        return {
          downloadText: "déjà traités",
          buttonLabel: "Liste des jeunes déjà traités",
        };
      default:
        return {
          downloadText: "",
          buttonLabel: "Télécharger la liste",
        };
    }
  };

  const onDownload = async () => {
    setIsFetching(true);
    setDownloadError(null);
    try {
      const { data } = await _getBlob(`/api/v1/organisation/mission-locale/export/effectifs`, {
        params: { type: [listType] },
        paramsSerializer: (params) => {
          return qs.stringify(params, { arrayFormat: "brackets" });
        },
      });
      const fileName = `Rupturants_TBA_${listType}_${new Date().toISOString().split("T")[0]}.xlsx`;
      trackPlausibleEvent("telechargement_mission_locale_liste");
      downloadObject(data, fileName, mime.getType("xlsx") ?? "text/plain");
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      setDownloadError("Une erreur est survenue lors du téléchargement. Veuillez réessayer.");
    } finally {
      setIsFetching(false);
    }
  };

  const labels = getLabels();

  return (
    <>
      {downloadError && (
        <Alert
          closable
          description={downloadError}
          onClose={() => setDownloadError(null)}
          severity="error"
          title="Une erreur s'est produite"
          classes={{
            root: "fr-mb-2w",
          }}
        />
      )}
      <div
        style={{
          background: "#f6f6f6",
          padding: "1rem",
          marginBottom: "1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <p className="fr-text--sm fr-mb-0">
          <strong>Télécharger la liste des jeunes {labels.downloadText}</strong>
        </p>
        <Button
          disabled={isFetching}
          iconId="ri-download-line"
          iconPosition="right"
          onClick={onDownload}
          priority="secondary"
          size="small"
          aria-busy={isFetching}
          aria-label={isFetching ? "Téléchargement en cours..." : labels.buttonLabel}
        >
          {isFetching && <Spinner size="1em" style={{ marginRight: "0.5rem" }} />}
          {labels.buttonLabel}
        </Button>
      </div>
    </>
  );
}
