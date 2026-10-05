import { useCallback, useState } from "react";
import { DEPARTEMENTS_BY_CODE } from "shared/constants/territoires";
import type { ICfaEtablissement } from "shared/models/data/nationalStats.model";

import { cfaEtablissementsExportColumns } from "@/common/exports";
import { _get } from "@/common/httpClient";
import { exportDataAsXlsx } from "@/common/utils/exportUtils";

import { NATURE_LABELS } from "../constants";

import { INDICATEURS_ML_BASE } from "./statsRoutes";
import { buildCfaEtablissementsRequestParams, type CfaEtablissementsParams } from "./useStatsQueries";

const ouiNon = (value: boolean | null) => (value === null ? "" : value ? "Oui" : "Non");

export function useCfaEtablissementsExport(params: CfaEtablissementsParams) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportData = useCallback(async () => {
    setIsExporting(true);
    setError(null);
    try {
      const { data } = await _get<{ data: ICfaEtablissement[] }>(
        `${INDICATEURS_ML_BASE}/stats/cfa/etablissements/export`,
        { params: buildCfaEtablissementsRequestParams(params) }
      );
      const rows = data.map((row) => {
        const departement = row.departement
          ? DEPARTEMENTS_BY_CODE[row.departement as keyof typeof DEPARTEMENTS_BY_CODE]
          : undefined;
        return {
          region: departement?.region.nom ?? "",
          departement: departement?.nom ?? row.departement ?? "",
          nom: row.nom ?? "",
          uai: row.uai ?? "",
          siret: row.siret,
          nature: NATURE_LABELS[row.nature ?? "inconnue"] ?? row.nature,
          qualiopi: ouiNon(row.qualiopi),
          code_postal: row.adresse?.code_postal ?? "",
          commune: row.adresse?.commune ?? "",
          adresse: row.adresse?.complete ?? "",
          compte_tba: ouiNon(row.has_account),
          collab_active: ouiNon(row.collab_active),
          nb_collaborations: row.nb_collaborations,
          derniere_activite: row.derniere_activite ?? "",
        };
      });
      const today = new Date();
      const date = [today.getDate(), today.getMonth() + 1, today.getFullYear() % 100]
        .map((part) => String(part).padStart(2, "0"))
        .join("-");
      exportDataAsXlsx(`Etablissements-de-formation-${date}.xlsx`, rows, cfaEtablissementsExportColumns);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Le téléchargement a échoué");
    } finally {
      setIsExporting(false);
    }
  }, [params]);

  return { exportData, isExporting, error, clearError: () => setError(null) };
}
