import { useCallback, useState } from "react";
import type { ICfaInvitationsExportResponse } from "shared/models/routes/admin/cfa-invitations-export.api";

import {
  cfaInvitationsChampsExportColumns,
  cfaInvitationsChampsRows,
  cfaInvitationsExportColumns,
} from "@/common/exports";
import { _get } from "@/common/httpClient";
import { exportMultiSheetXlsx } from "@/common/utils/exportUtils";

interface UseCfaInvitationsExportOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useCfaInvitationsExport({ onSuccess, onError }: UseCfaInvitationsExportOptions = {}) {
  const [isExporting, setIsExporting] = useState(false);

  const exportData = useCallback(async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      const data = await _get<ICfaInvitationsExportResponse>("/api/v1/admin/collaborations/cfa-invitations/export");

      const today = new Date();
      const day = String(today.getDate()).padStart(2, "0");
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const year = String(today.getFullYear()).slice(-2);
      const filename = `Invitations-ML-CFA-${day}-${month}-${year}.xlsx`;

      exportMultiSheetXlsx(filename, [
        {
          sheetName: "Invitations",
          rows: data.invitations as Record<string, unknown>[],
          columns: cfaInvitationsExportColumns,
        },
        {
          sheetName: "Champs",
          rows: cfaInvitationsChampsRows,
          columns: cfaInvitationsChampsExportColumns,
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
