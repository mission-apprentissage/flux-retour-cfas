import { useCallback, useState } from "react";
import type { ICollaborationExportResponseSchema } from "shared/models/routes/admin/collaboration-stats.api";

import {
  collaborationCfaActivesExportColumns,
  collaborationCfaCompatiblesExportColumns,
  collaborationCfaWithCollabExportColumns,
  collaborationDetailsExportColumns,
} from "@/common/exports";
import { _get } from "@/common/httpClient";
import { exportMultiSheetXlsx } from "@/common/utils/exportUtils";

interface UseCollaborationExportOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useCollaborationExport({ onSuccess, onError }: UseCollaborationExportOptions = {}) {
  const [isExporting, setIsExporting] = useState(false);

  const exportData = useCallback(async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      const data = await _get<ICollaborationExportResponseSchema>("/api/v1/admin/collaborations/export");

      const today = new Date();
      const day = String(today.getDate()).padStart(2, "0");
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const year = String(today.getFullYear()).slice(-2);
      const filename = `Collaborations-CFA-ML-${day}-${month}-${year}.xlsx`;

      exportMultiSheetXlsx(filename, [
        {
          sheetName: "CFA compatibles",
          rows: data.cfa_compatibles as Record<string, unknown>[],
          columns: collaborationCfaCompatiblesExportColumns,
        },
        {
          sheetName: "CFA activés",
          rows: data.cfa_actives as Record<string, unknown>[],
          columns: collaborationCfaActivesExportColumns,
        },
        {
          sheetName: "CFA avec collaboration",
          rows: data.cfa_with_collab as Record<string, unknown>[],
          columns: collaborationCfaWithCollabExportColumns,
        },
        {
          sheetName: "Détail collaborations",
          rows: data.details_collaborations as Record<string, unknown>[],
          columns: collaborationDetailsExportColumns,
        },
      ]);

      onSuccess?.();
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error("Le téléchargement a échoué"));
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, onSuccess, onError]);

  return { exportData, isExporting };
}
