import { useCallback, useState } from "react";

interface UseSortableTableOptions {
  onSortChange?: () => void;
}

interface UseSortableTableReturn<T extends string> {
  sortColumn: T;
  sortDirection: "asc" | "desc";
  handleSort: (column: T) => void;
  sortData: <D extends Record<string, unknown>>(data: D[]) => D[];
}

export function useSortableTable<T extends string>(
  defaultColumn: T,
  defaultDirection: "asc" | "desc" = "desc",
  options?: UseSortableTableOptions
): UseSortableTableReturn<T> {
  const [sortColumn, setSortColumn] = useState<T>(defaultColumn);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(defaultDirection);

  const handleSort = useCallback(
    (column: T) => {
      if (sortColumn === column) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortColumn(column);
        setSortDirection("desc");
      }
      options?.onSortChange?.();
    },
    [sortColumn, options]
  );

  const sortData = useCallback(
    <D extends Record<string, unknown>>(data: D[]): D[] => {
      return [...data].sort((a, b) => {
        const aVal = a[sortColumn] ?? 0;
        const bVal = b[sortColumn] ?? 0;

        if (sortColumn === "nom" || typeof aVal === "string") {
          const comparison = String(aVal).localeCompare(String(bVal), "fr");
          return sortDirection === "desc" ? -comparison : comparison;
        }

        const comparison = Number(aVal) - Number(bVal);
        return sortDirection === "desc" ? -comparison : comparison;
      });
    },
    [sortColumn, sortDirection]
  );

  return { sortColumn, sortDirection, handleSort, sortData };
}
