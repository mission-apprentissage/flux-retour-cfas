import { Box, Button, Divider, HStack, Text } from "@chakra-ui/react";
import { rankItem } from "@tanstack/match-sorter-utils";
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
import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";

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
  onRowClick = undefined,
  columns: columnsDef,
  renderSubComponent = undefined,
  getRowCanExpand = undefined,
  searchValue,
  onCountItemsChange,
  // pagination
  manualPagination = false,
  onPaginationChange = null,
  pagination = undefined,
  // sorting
  manualSorting = false,
  enableSorting = undefined,
  onSortingChange = null,
  sorting = undefined,
  pageSizes = [5, 10, 20, 30, 40, 50],
  triggerExpand = undefined,
  tableId = null,
  ...props
}: any) {
  const data: any[] = useMemo(() => defaultData, [defaultData]); // TODO TO CHECK RE-RENDERER WITH [defaultData] instead of []

  const [globalFilter, setGlobalFilter] = useState(searchValue);
  const countItems = useRef(data.length);

  useEffect(() => {
    setGlobalFilter(searchValue);
    if (searchValue === "") {
      onCountItemsChange?.(data.length);
    }
  }, [data.length, onCountItemsChange, searchValue]);

  const columnHelper = createColumnHelper();

  const columns = Object.keys(columnsDef).map((key) => {
    return columnHelper.accessor(key as any, columnsDef[key]);
  });

  const table = useReactTable({
    data,
    columns,
    getRowCanExpand,
    // pagination
    manualPagination,
    pageCount: pagination?.total || data?.length,
    ...(onPaginationChange
      ? {
          onPaginationChange: (updater: any) => {
            const oldState = table.getState();
            const newState = updater(oldState.pagination);
            onPaginationChange({ page: newState.pageIndex + 1, limit: newState.pageSize });
          },
        }
      : {}),
    // sorting
    enableSorting,
    manualSorting,
    onSortingChange,
    ...(onSortingChange
      ? {
          onSortingChange: (updater: any) => {
            const oldState = table.getState();
            const newState = updater(oldState.sorting);
            // weird behaviour: sometimes newState is empty so we rollback to oldState
            newState.length > 0
              ? onSortingChange({ field: newState[0].id, direction: newState[0].desc ? "-1" : "1" })
              : onSortingChange({ field: oldState.sorting[0].id, direction: oldState.sorting[0].desc ? "1" : "-1" });
          },
        }
      : {}),
    // general
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    ...(manualPagination ? {} : { getFilteredRowModel: getFilteredRowModel() }),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: fuzzyFilter,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      globalFilter,
      ...(pagination
        ? {
            pagination: {
              pageSize: pagination?.limit || 10,
              pageIndex: (pagination?.page || 1) - 1,
            },
          }
        : {}),
      ...(sorting ? { sorting } : {}),
    },
    // initialState: {},
  });

  // In order to manage multi table with same toggle state
  useEffect(() => {
    triggerExpand &&
      table.getRowModel().rows.forEach((row) => {
        row.id === triggerExpand.rowId && tableId === triggerExpand.tableId
          ? row.toggleExpanded()
          : row.toggleExpanded(false);
      });
  }, [triggerExpand]);

  useEffect(() => {
    if (countItems.current !== table.getPrePaginationRowModel().rows.length) {
      countItems.current = table.getPrePaginationRowModel().rows.length;
      onCountItemsChange(countItems.current);
    }
  }, [onCountItemsChange, table]);

  if (table.getPrePaginationRowModel().rows.length === 0) return null;

  return (
    <div className="flex flex-col">
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
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className: header.column.getCanSort() ? "cursor-pointer select-none" : "",
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: " 🔼",
                          desc: " 🔽",
                        }[header.column.getIsSorted() as any] ?? null}
                      </div>
                    )}
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
                  bg={j % 2 === 0 ? "#EEEEEE" : "white"}
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
      {data.length > 5 && (
        <>
          {" "}
          <Divider my={2} />
          <HStack spacing={3} justifyContent="space-between">
            <HStack spacing={3}>
              <Button variant="unstyled" onClick={() => table.setPageIndex(0)} isDisabled={!table.getCanPreviousPage()}>
                <Box className="ri-skip-back-fill" mt="0.250rem !important" />
              </Button>
              <Button variant="unstyled" onClick={() => table.previousPage()} isDisabled={!table.getCanPreviousPage()}>
                <HStack>
                  <Box as="i" className="ri-arrow-left-s-line" mt="0.250rem !important" />
                  <Text>Page précédente </Text>
                </HStack>
              </Button>

              <Box px={5}>
                <Button {...{ bg: "bluefrance", color: "white", pointerEvents: "none" }}>
                  {table.getState().pagination.pageIndex + 1}
                </Button>
              </Box>

              <Button variant="unstyled" onClick={() => table.nextPage()} isDisabled={!table.getCanNextPage()}>
                <HStack>
                  <Text>Page suivante </Text>
                  <Box as="i" className="ri-arrow-right-s-line" mt="0.250rem !important" />
                </HStack>
              </Button>
              <Button
                variant="unstyled"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                isDisabled={!table.getCanNextPage()}
              >
                <Box className="ri-skip-forward-fill" mt="0.250rem !important" />
              </Button>
            </HStack>

            <HStack spacing={3} justifyContent="flex-end">
              <Box pt={2}>
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={(e) => {
                    table.setPageSize(Number(e.target.value));
                  }}
                >
                  {pageSizes.map((pageSize) => (
                    <option key={pageSize} value={pageSize}>
                      Voir par {pageSize}
                    </option>
                  ))}
                </select>
              </Box>
            </HStack>
          </HStack>
        </>
      )}
    </div>
  );
}
