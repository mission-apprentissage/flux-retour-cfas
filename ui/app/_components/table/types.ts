import { SortingState, ColumnFiltersState } from "@tanstack/react-table";
import { ReactNode } from "react";

export interface ColumnData {
  label: string | ReactNode;
  dataKey: string;
  width?: number | string;
  numeric?: boolean;
  sortable?: boolean;
}

export interface TableRow<R = unknown> {
  rawData: R;
  element: Record<string, ReactNode>;
  _id?: string;
}

export type TableRowData = Record<string, unknown> & {
  _element: Record<string, ReactNode>;
  _rawData: unknown;
  _id?: string;
};

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}

export interface FullTableProps<R = unknown> {
  data: TableRow<R>[];
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
  onRowClick?: (rowData: R & { _id?: string }) => void;
  renderSubComponent?: (rowData: R & { _id?: string }) => ReactNode;
  getRowCanExpand?: (rowData: R & { _id?: string }) => boolean;
  expandColumnLabel?: string;
  expandedByDefault?: boolean;
  expandMode?: "single" | "multiple";
  tableLabel?: string;
}
