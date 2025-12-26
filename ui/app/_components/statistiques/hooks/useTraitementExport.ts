import { useState, useCallback } from "react";
import type { ITraitementExportResponse } from "shared/models/data/nationalStats.model";

import { traitementMLExportColumns, traitementRegionExportColumns } from "@/common/exports";
import { _get } from "@/common/httpClient";
import { exportMultiSheetXlsx } from "@/common/utils/exportUtils";

interface UseTraitementExportOptions {
  region?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useTraitementExport({ region, onSuccess, onError }: UseTraitementExportOptions = {}) {
  const [isExporting, setIsExporting] = useState(false);

  const exportData = useCallback(async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      const data = await _get<ITraitementExportResponse>(
        "/api/v1/organisation/indicateurs-ml/stats/traitement/export",
        {
          params: region ? { region } : {},
        }
      );

      const today = new Date();
      const day = String(today.getDate()).padStart(2, "0");
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const year = String(today.getFullYear()).slice(-2);
      const filename = `Suivi-deploiement-ML-${day}-${month}-${year}.xlsx`;

      exportMultiSheetXlsx(filename, [
        {
          sheetName: "Par Mission Locale",
          rows: data.mlData as Record<string, unknown>[],
          columns: traitementMLExportColumns,
        },
        {
          sheetName: "Par region",
          rows: data.regionData as Record<string, unknown>[],
          columns: traitementRegionExportColumns,
        },
      ]);

      onSuccess?.();
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error("Le téléchargement a échoué"));
    } finally {
      setIsExporting(false);
    }
  }, [region, isExporting, onSuccess, onError]);

  return { exportData, isExporting };
}
