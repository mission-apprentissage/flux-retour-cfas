import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

import { ColumnData, TableRow, TableRowData } from "./types";

export function useTableData<R>(data: TableRow<R>[]): TableRowData[] {
  return useMemo(() => {
    return data.map((item) => ({
      ...(item.rawData as Record<string, unknown>),
      _element: item.element,
      _rawData: item.rawData,
      _id: item._id,
    }));
  }, [data]);
}

export function useTableColumns(columns: ColumnData[]) {
  return useMemo<ColumnDef<TableRowData, unknown>[]>(
    () =>
      columns.map((col) => ({
        accessorKey: col.dataKey,
        id: col.dataKey,
        header: () => col.label,
        size: typeof col.width === "string" ? parseInt(col.width.replace("%", "")) : col.width || 100,
        enableSorting: col.sortable !== false && col.dataKey !== "actions",
        accessorFn: (row) => (row._rawData as Record<string, unknown> | undefined)?.[col.dataKey] ?? row[col.dataKey],
        cell: ({ row }) => row.original._element[col.dataKey],
        meta: {
          width: col.width,
          numeric: col.numeric,
          originalColumn: col,
        },
      })),
    [columns]
  );
}
