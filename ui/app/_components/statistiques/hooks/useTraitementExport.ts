import { useState, useCallback } from "react";
import type { ITraitementExportResponse } from "shared/models/data/nationalStats.model";

import {
  traitementCollabExportColumns,
  traitementMLExportColumns,
  traitementRegionExportColumns,
  traitementRuptureExportColumns,
} from "@/common/exports";
import { _get } from "@/common/httpClient";
import { exportMultiSheetXlsx } from "@/common/utils/exportUtils";

interface UseTraitementExportOptions {
  region?: string;
  mlId?: string;
  national?: boolean;
  mlNom?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

const toFilenameSlug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Export xlsx du suivi : feuilles « tous segments » (par ML, par région), puis une feuille par segment. */
export function useTraitementExport({
  region,
  mlId,
  national,
  mlNom,
  onSuccess,
  onError,
}: UseTraitementExportOptions = {}) {
  const [isExporting, setIsExporting] = useState(false);

  const exportData = useCallback(async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      const data = await _get<ITraitementExportResponse>(
        "/api/v1/organisation/indicateurs-ml/stats/traitement/export",
        {
          params: mlId ? { ml_id: mlId } : region ? { region } : national ? { national: true } : {},
        }
      );

      const today = new Date();
      const day = String(today.getDate()).padStart(2, "0");
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const year = String(today.getFullYear()).slice(-2);
      const suffix = mlNom ? `-${toFilenameSlug(mlNom)}` : "";
      const filename = `Suivi-deploiement-ML${suffix}-${day}-${month}-${year}.xlsx`;

      exportMultiSheetXlsx(filename, [
        {
          sheetName: "Tous segments - par ML",
          rows: data.mlData as Record<string, unknown>[],
          columns: traitementMLExportColumns,
        },
        ...(mlId
          ? []
          : [
              {
                sheetName: "Tous segments - par region",
                rows: data.regionData as Record<string, unknown>[],
                columns: traitementRegionExportColumns,
              },
            ]),
        {
          sheetName: "Ruptures",
          rows: data.rows_rupture as Record<string, unknown>[],
          columns: traitementRuptureExportColumns,
        },
        {
          sheetName: "Collaborations",
          rows: data.rows_collab as Record<string, unknown>[],
          columns: traitementCollabExportColumns,
        },
      ]);

      onSuccess?.();
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error("Le téléchargement a échoué"));
    } finally {
      setIsExporting(false);
    }
  }, [region, mlId, national, mlNom, isExporting, onSuccess, onError]);

  return { exportData, isExporting };
}
