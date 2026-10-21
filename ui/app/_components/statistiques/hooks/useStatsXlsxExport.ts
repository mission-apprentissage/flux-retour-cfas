import { useState } from "react";

import { type ExportColumn, exportDataAsXlsx } from "@/common/utils/exportUtils";

/** Export xlsx d'une liste de stats : `Prefixe-JJ-MM-AA.xlsx`, avec état de chargement et message d'erreur. */
export function useStatsXlsxExport(
  filenamePrefix: string,
  columns: ReadonlyArray<ExportColumn>,
  loadRows: () => Promise<Record<string, unknown>[]>
) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportData = async () => {
    setIsExporting(true);
    setError(null);
    try {
      const rows = await loadRows();
      const today = new Date();
      const date = [today.getDate(), today.getMonth() + 1, today.getFullYear() % 100]
        .map((part) => String(part).padStart(2, "0"))
        .join("-");
      exportDataAsXlsx(`${filenamePrefix}-${date}.xlsx`, rows, columns);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Le téléchargement a échoué");
    } finally {
      setIsExporting(false);
    }
  };

  return { exportData, isExporting, error, clearError: () => setError(null) };
}
