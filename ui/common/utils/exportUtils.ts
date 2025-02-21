import { utils, writeFileXLSX } from "xlsx";

export interface ExportColumn {
  label: string;
  key: string;
  width: number; // only used in xlsx documents
  xlsxType?: "string" | "date"; // only used in xlsx documents
}

export function exportDataAsXlsx<Columns extends ReadonlyArray<ExportColumn>>(
  filename: string,
  rows: Record<Columns[number]["key"], any>[],
  exportColumns: Columns
) {
  const workbook = utils.book_new();

  const columnsWithXlsxType = exportColumns.filter((column) => column.xlsxType);

  for (const row of rows) {
    for (const column of columnsWithXlsxType) {
      if (column.xlsxType === "date" && row[column.key]) {
        row[column.key] = new Date(row[column.key]);
      } else if (column.xlsxType === "string" && row[column.key]) {
        row[column.key] = {
          v: row[column.key],
          t: "s",
          w: `${row[column.key]}`,
        };
      }
    }
  }

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

export const MODEL_EXPORT_LAST_UPDATE = "29012025";
