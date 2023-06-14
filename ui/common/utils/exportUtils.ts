import { utils, writeFileXLSX } from "xlsx";

import { downloadObject } from "./browser";
import { escapeCSVField } from "./stringUtils";

export interface ExportColumn {
  label: string;
  key: string;
  width: number; // only used in xlsx documents
}

export function exportDataAsXlsx(filename: string, rows: any[], exportColumns: ExportColumn[]) {
  const workbook = utils.book_new();
  const worksheet = utils.json_to_sheet(rows, {
    header: exportColumns.map((column) => column.key),
  });
  utils.book_append_sheet(workbook, worksheet, "Liste");

  // rewrite the header line with good labels
  utils.sheet_add_aoa(worksheet, [exportColumns.map((column) => column.label)], {
    origin: "A1",
  });

  // set the columns widths in characters
  worksheet["!cols"] = exportColumns.map((column) => ({ wch: column.width }));

  writeFileXLSX(workbook, filename, { compression: true });
}

export function exportDataAsCSV(filename: string, rows: any[], exportColumns: ExportColumn[]) {
  downloadObject(
    [
      exportColumns.map((column) => column.label).join(","),
      ...rows.map((row) =>
        exportColumns
          .map((column) => `${row[column.key] ?? ""}`)
          .map((v) => escapeCSVField(v))
          .join(",")
      ),
    ].join("\n"),
    filename,
    "text/csv"
  );
  return;
}
