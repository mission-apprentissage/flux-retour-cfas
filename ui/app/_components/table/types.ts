import { SortingState } from "@tanstack/react-table";

export interface ColumnData {
  label: string;
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
  sorting?: SortingState;
  pageSize?: number;
}
