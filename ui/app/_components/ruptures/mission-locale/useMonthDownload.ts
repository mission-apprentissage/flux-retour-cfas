import mime from "mime";
import qs from "qs";
import { useState } from "react";
import { IMissionLocaleEffectifList } from "shared";

import { usePlausibleAppTracking } from "@/app/_hooks/plausible";
import { formatMonthAndYear } from "@/app/_utils/ruptures.utils";
import { _getBlob } from "@/common/httpClient";
import { downloadObject } from "@/common/utils/browser";

export function useMonthDownload() {
  const [isFetching, setIsFetching] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const { trackPlausibleEvent } = usePlausibleAppTracking();

  const downloadMonth = async (month: string, listType: IMissionLocaleEffectifList) => {
    setIsFetching(true);
    setDownloadError(null);
    try {
      const { data } = await _getBlob(`/api/v1/organisation/mission-locale/export/effectifs`, {
        params: { type: [listType], month },
        paramsSerializer: (params) => {
          return qs.stringify(params, { arrayFormat: "brackets" });
        },
      });
      const monthLabel =
        month === "plus-de-180-j"
          ? "plus_de_180j"
          : formatMonthAndYear(month)
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/\s/g, "_")
              .toLowerCase();
      const fileName = `Rupturants_TBA_${listType}_${monthLabel}_${new Date().toISOString().split("T")[0]}.xlsx`;
      trackPlausibleEvent("telechargement_mission_locale_liste_mois");
      downloadObject(data, fileName, mime.getType("xlsx") ?? "text/plain");
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      setDownloadError("Une erreur est survenue lors du téléchargement. Veuillez réessayer.");
    } finally {
      setIsFetching(false);
    }
  };

  return { downloadMonth, isFetching, downloadError, setDownloadError };
}
