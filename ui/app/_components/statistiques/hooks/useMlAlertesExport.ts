import type { IMlAlerteListeRow, MlAlerteListeType } from "shared/models/data/nationalStats.model";

import { mlAlertesExportColumns } from "@/common/exports";
import { _get } from "@/common/httpClient";

import { INDICATEURS_ML_BASE } from "./statsRoutes";
import { avecVueFrance, type MlAlertesParams } from "./useStatsQueries";
import { useStatsXlsxExport } from "./useStatsXlsxExport";

const PREFIXES: Record<MlAlerteListeType, string> = {
  non_engagee: "ML-non-engagees",
  delai_collab: "ML-delai-collab-eleve",
  a_recontacter: "ML-jeunes-a-recontacter",
  collab_sans_compte: "ML-collab-sans-compte",
};

export function useMlAlertesExport(type: MlAlerteListeType, params: MlAlertesParams) {
  return useStatsXlsxExport(PREFIXES[type], mlAlertesExportColumns, async () => {
    const { data } = await _get<{ data: IMlAlerteListeRow[] }>(
      `${INDICATEURS_ML_BASE}/stats/ml/alertes/${type}/export`,
      {
        params: avecVueFrance(params),
      }
    );
    return data.map((row) => ({
      nom: row.nom,
      code_postal: row.code_postal ?? "",
      commune: row.commune ?? "",
      utilise_service: row.is_activated ? "Oui" : "Non",
      total_jeunes: row.total_jeunes,
      a_traiter: row.a_traiter,
      a_recontacter: row.a_recontacter,
      pourcentage_traites: row.pourcentage_traites,
      delai_moyen_jours: row.delai_moyen_jours ?? "",
      jours_depuis_activite: row.jours_depuis_activite ?? "",
    }));
  });
}
