import { SortingState, ColumnFiltersState } from "@tanstack/react-table";
import { ReactNode } from "react";

export interface ColumnData {
  label: string | ReactNode;
  dataKey: string;
  width?: number | string;
  numeric?: boolean;
  sortable?: boolean;
}

export interface TableRowData {
  [key: string]: any;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}

export interface FullTableProps {
  data: TableRowData[];
  columns: ColumnData[];
  pagination?: PaginationInfo | null;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSortingChange?: (sorting: SortingState) => void;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  sorting?: SortingState;
  columnFilters?: ColumnFiltersState;
  pageSize?: number;
  emptyMessage?: string;
  caption?: string | null;
  headerAction?: ReactNode;
  hasPagination?: boolean;
}
