import { useCallback, useState } from "react";

import { _get } from "@/common/httpClient";
import { exportDataAsXlsx, type ExportColumn } from "@/common/utils/exportUtils";

type ExportResponse = {
  attributes: string[];
  contacts: Array<{ email: string; attributes: Record<string, unknown> }>;
};

interface UseTbaContactsExportOptions {
  slug: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Récupère le payload complet (tous les contacts + tous les attributs au format
 * exact qui partirait à Brevo) et le télécharge en Excel. Le fichier peut être
 * réimporté manuellement dans Brevo via Contacts > Importer (mêmes noms de
 * colonnes que les attributs Brevo).
 */
export function useTbaContactsExport({ slug, onSuccess, onError }: UseTbaContactsExportOptions) {
  const [isExporting, setIsExporting] = useState(false);

  const exportData = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const data = await _get<ExportResponse>(`/api/v1/admin/brevo-contacts/${slug}/export`);

      // Aplatit { email, attributes: {...} } en { EMAIL, CIVILITE, ... } pour Excel.
      const rows = data.contacts.map((c) => ({ EMAIL: c.email, ...c.attributes }));

      const sortedAttrs = [...data.attributes].sort();
      const columns: ExportColumn[] = [
        { label: "EMAIL", key: "EMAIL", width: 35 },
        ...sortedAttrs.map((name) => ({ label: name, key: name, width: 22 })),
      ];

      const today = new Date();
      const ddmmyy = `${String(today.getDate()).padStart(2, "0")}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getFullYear()).slice(-2)}`;
      const filename = `${slug}-${ddmmyy}.xlsx`;

      exportDataAsXlsx(filename, rows as Record<string, any>[], columns);
      onSuccess?.();
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error("Le téléchargement a échoué"));
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, slug, onSuccess, onError]);

  return { exportData, isExporting };
}
