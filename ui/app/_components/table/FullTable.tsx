"use client";

import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import { Table } from "@codegouvfr/react-dsfr/Table";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  Header,
  Cell,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { useCallback, useRef } from "react";

import { useTableData, useTableColumns } from "./hooks";
import { FullTableProps, TableRowData } from "./types";

function SortIcon({ isSorted }: { isSorted: false | "asc" | "desc" }) {
  const iconClass = isSorted === "desc" ? "ri-arrow-down-line" : "ri-arrow-up-line";
  const color = isSorted ? "#000" : "#999";

  return (
    <span style={{ display: "flex", alignItems: "center", marginLeft: "0.5rem" }}>
      <i className={iconClass} style={{ color }} />
    </span>
  );
}

function TableHeaderCell({ header }: { header: Header<TableRowData, unknown> }) {
  const canSort = header.column.getCanSort();

  return (
    <div
      style={{ cursor: canSort ? "pointer" : "default", display: "flex" }}
      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
    >
      {flexRender(header.column.columnDef.header, header.getContext())}
      {canSort && <SortIcon isSorted={header.column.getIsSorted()} />}
    </div>
  );
}

function TableBodyCell({ cell }: { cell: Cell<TableRowData, unknown> }) {
  return (
    <div
      style={{
        maxWidth: "500px",
      }}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </div>
  );
}

function TablePagination({
  totalPages,
  currentPage,
  onPageChange,
}: {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div style={{ flex: "none" }}>
      <Pagination
        key={currentPage}
        count={totalPages}
        defaultPage={currentPage}
        getPageLinkProps={(pageNumber) => ({
          href: `#page-${pageNumber}`,
          onClick: (e) => {
            e.preventDefault();
            onPageChange(pageNumber);
          },
        })}
        showFirstLast
      />
    </div>
  );
}

function PageSizeSelector({
  pageSize,
  onPageSizeChange,
}: {
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const pageSizeOptions = [5, 10, 20, 50];
  return (
    <Select
      label=""
      options={pageSizeOptions.map((size) => ({
        value: size.toString(),
        label: `Voir par ${size}`,
      }))}
      nativeSelectProps={{
        value: pageSize.toString(),
        onChange: (e) => onPageSizeChange(Number(e.target.value)),
      }}
    />
  );
}

export function FullTable({
  data,
  columns,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSortingChange,
  onColumnFiltersChange,
  sorting = [],
  columnFilters = [],
  pageSize = 20,
  emptyMessage = "Aucun élément à afficher",
  caption = null,
  headerAction = null,
  hasPagination = true,
}: FullTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const tableData = useTableData(data);
  const tableColumns = useTableColumns(columns);

  const scrollToTop = useCallback(() => {
    if (tableRef.current) {
      setTimeout(() => {
        if (tableRef.current) {
          const rect = tableRef.current.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const targetPosition = rect.top + scrollTop - 20;

          window.scrollTo({
            top: targetPosition,
            behavior: "smooth",
          });
        }
      }, 100);
    }
  }, []);

  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: onSortingChange || (() => {}),
    onColumnFiltersChange: onColumnFiltersChange || (() => {}),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableSorting: true,
    enableColumnFilters: true,
    manualSorting: false,
    manualFiltering: false,
    manualPagination: true,
    pageCount: pagination?.lastPage || 1,
  });

  const handlePageChange = useCallback(
    (page: number) => {
      onPageChange?.(page);
      scrollToTop();
    },
    [onPageChange, scrollToTop]
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      onPageSizeChange?.(newPageSize);
      handlePageChange(1);
    },
    [onPageSizeChange, handlePageChange]
  );

  const isEmpty = data.length === 0;
  const totalPages = pagination?.lastPage || 1;
  const currentPage = pagination?.page || 1;

  return (
    <>
      {isEmpty ? (
        <p>{emptyMessage}</p>
      ) : (
        <div ref={tableRef}>
          {(caption || headerAction) && (
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}
            >
              {caption && <h4 style={{ margin: 0 }}>{caption}</h4>}
              {headerAction && <div>{headerAction}</div>}
            </div>
          )}
          <Table
            headers={
              table
                .getHeaderGroups()[0]
                ?.headers.map((header) => <TableHeaderCell key={header.id} header={header} />) || []
            }
            data={table
              .getSortedRowModel()
              .rows.map((row) => row.getVisibleCells().map((cell) => <TableBodyCell key={cell.id} cell={cell} />))}
          />
          {hasPagination && (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <TablePagination totalPages={totalPages} currentPage={currentPage} onPageChange={handlePageChange} />
              <div style={{ width: "150px" }}>
                <PageSizeSelector pageSize={pageSize} onPageSizeChange={handlePageSizeChange} />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
