import { utils, writeFileXLSX } from "xlsx";

import { pick } from "./array";

export interface ExportColumn {
  label: string;
  key: string;
  width: number; // only used in xlsx documents
}

export function exportDataAsXlsx<Columns extends ReadonlyArray<ExportColumn>>(
  filename: string,
  rows: Record<Columns[number]["key"], any>[],
  exportColumns: Columns
) {
  const workbook = utils.book_new();
  const headers = exportColumns.map((column) => column.key);
  const worksheet = utils.json_to_sheet(
    rows.map((row) => pick(row, headers as unknown as any)),
    {
      header: headers,
    }
  );
  utils.book_append_sheet(workbook, worksheet, "Liste");

  // rewrite the header line with good labels
  utils.sheet_add_aoa(worksheet, [exportColumns.map((column) => column.label)], {
    origin: "A1",
  });

  // set the columns widths in characters
  worksheet["!cols"] = exportColumns.map((column) => ({ wch: column.width }));

  writeFileXLSX(workbook, filename, { compression: true });
}
