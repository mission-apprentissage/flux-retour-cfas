import type { ICfaInjoignablesRow } from "shared/models/data/nationalStats.model";

import { cfaInjoignablesExportColumns } from "@/common/exports";
import { _get } from "@/common/httpClient";

import { INDICATEURS_ML_BASE } from "./statsRoutes";
import type { CfaInjoignablesParams } from "./useStatsQueries";
import { useStatsXlsxExport } from "./useStatsXlsxExport";

export function useCfaInjoignablesExport(params: CfaInjoignablesParams) {
  return useStatsXlsxExport("CFA-taux-eleve-injoignables", cfaInjoignablesExportColumns, async () => {
    const { data } = await _get<{ data: ICfaInjoignablesRow[] }>(
      `${INDICATEURS_ML_BASE}/stats/cfa/injoignables/export`,
      { params }
    );
    return data.map((row) => ({
      nom: row.nom ?? "",
      uai: row.uai ?? "",
      siret: row.siret,
      code_postal: row.adresse?.code_postal ?? "",
      commune: row.adresse?.commune ?? "",
      adresse: row.adresse?.complete ?? "",
      traites: row.traites,
      injoignables: row.injoignables,
      taux: row.taux,
    }));
  });
}
