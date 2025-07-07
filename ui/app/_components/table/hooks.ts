import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

import { ColumnData, TableRowData } from "./types";

export function useTableData(data: TableRowData[]) {
  return useMemo(() => {
    return data.map((item) => ({
      ...item.rawData,
      _element: item.element,
      _rawData: item.rawData,
    }));
  }, [data]);
}

export function useTableColumns(columns: ColumnData[]) {
  return useMemo<ColumnDef<any>[]>(
    () =>
      columns.map((col) => ({
        accessorKey: col.dataKey,
        id: col.dataKey,
        header: () => col.label,
        size: typeof col.width === "string" ? parseInt(col.width.replace("%", "")) : col.width || 100,
        enableSorting: col.sortable !== false && col.dataKey !== "actions",
        accessorFn: (row) => row._rawData?.[col.dataKey] ?? row[col.dataKey],
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
