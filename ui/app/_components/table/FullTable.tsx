"use client";

import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { Box } from "@mui/material";
import { useReactTable, getCoreRowModel, flexRender, Header, Cell } from "@tanstack/react-table";
import { useCallback } from "react";

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
    <Box
      sx={{ cursor: "pointer", display: "flex" }}
      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
    >
      {flexRender(header.column.columnDef.header, header.getContext())}
      {canSort && <SortIcon isSorted={header.column.getIsSorted()} />}
    </Box>
  );
}

function TableBodyCell({ cell }: { cell: Cell<TableRowData, unknown> }) {
  return (
    <Box
      sx={{
        maxWidth: "500px",
      }}
    >
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </Box>
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
  if (totalPages <= 1) return null;

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
  sorting = [],
  pageSize = 20,
}: FullTableProps) {
  const tableData = useTableData(data);
  const tableColumns = useTableColumns(columns);

  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
    state: {
      sorting,
    },
    onSortingChange: onSortingChange || (() => {}),
    getCoreRowModel: getCoreRowModel(),
    enableSorting: true,
    manualSorting: true,
    manualPagination: true,
    pageCount: pagination?.lastPage || 1,
  });

  const handlePageChange = useCallback(
    (page: number) => {
      onPageChange?.(page);
    },
    [onPageChange]
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      onPageSizeChange?.(newPageSize);
    },
    [onPageSizeChange]
  );

  const isEmpty = data.length === 0;
  const totalPages = pagination?.lastPage || 1;
  const currentPage = pagination?.page || 1;

  return (
    <>
      {isEmpty ? (
        <p>Aucun élément à afficher</p>
      ) : (
        <>
          <Table
            headers={
              table
                .getHeaderGroups()[0]
                ?.headers.map((header) => <TableHeaderCell key={header.id} header={header} />) || []
            }
            data={table
              .getCoreRowModel()
              .rows.map((row) => row.getVisibleCells().map((cell) => <TableBodyCell key={cell.id} cell={cell} />))}
          />
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            {totalPages > 1 && (
              <TablePagination totalPages={totalPages} currentPage={currentPage} onPageChange={handlePageChange} />
            )}
            <Box sx={{ width: "150px" }}>
              <PageSizeSelector pageSize={pageSize} onPageSizeChange={handlePageSizeChange} />
            </Box>
          </Box>
        </>
      )}
    </>
  );
}
