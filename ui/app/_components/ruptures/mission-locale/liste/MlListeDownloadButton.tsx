"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import mime from "mime";
import qs from "qs";
import { useState } from "react";
import { IMissionLocaleEffectifList } from "shared";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import { _getBlob } from "@/common/httpClient";
import { downloadObject } from "@/common/utils/browser";

export function MlListeDownloadButton({
  nomListe,
  onError,
}: {
  nomListe: IMissionLocaleEffectifList;
  onError: (message: string | null) => void;
}) {
  const [isFetching, setIsFetching] = useState(false);
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  const onDownload = async () => {
    setIsFetching(true);
    onError(null);
    try {
      const { data } = await _getBlob(`/api/v1/organisation/mission-locale/export/effectifs`, {
        params: { type: [nomListe] },
        paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "brackets" }),
      });
      const fileName = `Rupturants_TBA_${nomListe}_${new Date().toISOString().split("T")[0]}.xlsx`;
      trackPlausibleEvent("telechargement_mission_locale_liste");
      downloadObject(data, fileName, mime.getType("xlsx") ?? "text/plain");
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      onError("Une erreur est survenue lors du téléchargement. Veuillez réessayer.");
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <Button
      priority="secondary"
      size="small"
      iconId="ri-download-line"
      iconPosition="right"
      disabled={isFetching}
      onClick={onDownload}
    >
      Télécharger cette liste
    </Button>
  );
}
