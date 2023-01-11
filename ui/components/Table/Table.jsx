import React, { Fragment, useEffect, useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Box, Button, Divider, HStack } from "@chakra-ui/react";

import { rankItem } from "@tanstack/match-sorter-utils";
import { Input } from "../../modules/mon-espace/effectifs/engine/formEngine/components/Input/Input";

const fuzzyFilter = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value);

  // Store the itemRank info
  addMeta({
    itemRank,
  });

  // Return if the item should be filtered in/out
  return itemRank.passed;
};

export default function Table({
  data: defaultData,
  onRowClick,
  columns: columnsDef,
  renderSubComponent,
  getRowCanExpand,
  searchValue,
  pageSize = 5,
  ...props
}) {
  const data = useMemo(
    () => defaultData,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [globalFilter, setGlobalFilter] = useState(searchValue);

  useEffect(() => {
    setGlobalFilter(searchValue);
  }, [searchValue]);

  const columnHelper = createColumnHelper();

  const columns = Object.keys(columnsDef).map((key) => {
    return columnHelper.accessor(key, columnsDef[key]);
  });

  const table = useReactTable({
    data,
    columns,
    getRowCanExpand,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  return (
    <>
      <Box>
        <Box as="table" flex={1} fontSize="delta" w="100%" {...props}>
          <Box as="thead">
            {table.getHeaderGroups().map((headerGroup, key) => (
              <Box as="tr" key={key} borderBottom="3px solid" borderColor="bluefrance">
                {headerGroup.headers.map((header) => {
                  return (
                    <Box
                      as="th"
                      key={header.id}
                      fontWeight="bold"
                      fontSize="0.9rem"
                      overflow="hidden"
                      borderColor="grey.800"
                      color="grey.800"
                      {...{
                        colSpan: header.colSpan,
                        style: {
                          width: header.getSize(),
                        },
                      }}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>
          <Box as="tbody">
            {table.getRowModel().rows.map((row, j) => {
              return (
                <Fragment key={row.id}>
                  <Box
                    as="tr"
                    bg={j % 2 === 0 ? "galt" : "white"}
                    py="3"
                    data-rowindex={row.id}
                    onClick={() => onRowClick?.(row.id)}
                  >
                    {/* first row is a normal row */}
                    {row.getVisibleCells().map((cell) => {
                      return (
                        <Box as="td" key={cell.id} overflow="hidden">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </Box>
                      );
                    })}
                  </Box>
                  {row.getIsExpanded() && renderSubComponent && (
                    <Box as="tr">
                      {/* 2nd row is a custom 1 cell row */}
                      <Box as="td" colSpan={row.getVisibleCells().length}>
                        {renderSubComponent({ row })}
                      </Box>
                    </Box>
                  )}
                </Fragment>
              );
            })}
          </Box>
        </Box>
      </Box>
      <Divider />
      <HStack spacing={2} justifyContent="center" mt={5}>
        <Button
          className="border rounded p-1"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          <Box as="i" className="ri-skip-back-fill" />
        </Button>
        <Button
          className="border rounded p-1"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <Box as="i" className="ri-arrow-left-s-line" />
        </Button>

        <Button {...{ bg: "bluefrance", color: "white", pointerEvents: "none" }}>
          {table.getState().pagination.pageIndex + 1}
        </Button>
        <Button className="border rounded p-1" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          <Box as="i" className="ri-arrow-right-s-line" />
        </Button>
        <Button
          className="border rounded p-1"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          <Box as="i" className="ri-skip-forward-fill" />
        </Button>
        <HStack className="flex items-center gap-1">
          <div>Page</div>
          <strong>
            {table.getState().pagination.pageIndex + 1} sur {table.getPageCount() || 1}
          </strong>
        </HStack>
      </HStack>
      <HStack spacing={3} justifyContent="flex-end">
        {table.getPageCount() > 1 && (
          <HStack className="flex items-center gap-1">
            <Box pt={2}>Aller à la page</Box>
            <Input
              {...{
                name: `page`,
                fieldType: "numberStepper",
                placeholder: "Aller à la page",
                precision: 0,
                max: table.getPageCount(),
                min: 1,
              }}
              onSubmit={(value) => {
                const page = value ? Number(value) - 1 : 0;
                table.setPageIndex(page);
              }}
              w="80px"
              value={table.getState().pagination.pageIndex + 1}
            />
          </HStack>
        )}
        <Box pt={2}>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
          >
            {[5, 10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Voir par {pageSize}
              </option>
            ))}
          </select>
        </Box>
      </HStack>
    </>
  );
}
