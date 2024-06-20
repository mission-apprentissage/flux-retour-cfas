import { Box, Button, HStack, Select, SystemProps, Table, Tbody, Td, Th, Thead, Tr, Flex } from "@chakra-ui/react";
import {
  ColumnDef,
  Row,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  flexRender,
} from "@tanstack/react-table";
import { useState, useEffect, useMemo, useRef, useCallback, Fragment } from "react";

import RowsSkeleton from "@/components/skeletons/RowsSkeleton";

import { ChevronLeftIcon, ChevronRightIcon, FirstPageIcon, LastPageIcon } from "../../modules/dashboard/icons";

import ConditionalScrollShadowBox from "./ConditionalScrollShadowBox";

interface TableWithPaginationProps<T> extends SystemProps {
  columns: ColumnDef<T>[];
  data: T[];
  noDataMessage?: string;
  loading?: boolean;
  isRowExpanded?: boolean;
  sortingState?: SortingState;
  paginationState?: PaginationState;
  variant?: string;
  showPagination?: boolean;
  pageCount: number;
  onSortingChange?: (state: SortingState) => void;
  renderSubComponent?: (row: Row<T>) => React.ReactElement;
  renderDivider?: () => React.ReactElement;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  fixedColumns?: string[];
  rightFixedColumn?: string;
  enableHorizontalScroll?: boolean;
}

const DEFAULT_COL_SIZE = 220;
const DEFAULT_ROW_HEIGHT = 60;

const TableWithPagination = <T,>(props: TableWithPaginationProps<T & { prominent?: boolean }>) => {
  const tableRef = useRef<HTMLTableElement>(null);
  const [tableWidth, setTableWidth] = useState(0);
  const [sortingState, setSortingState] = useState<SortingState>(props.sortingState || []);

  useEffect(() => {
    if (tableRef.current) {
      setTableWidth(tableRef.current.scrollWidth);
    }
  }, [props.data, props.columns]);

  const table = useReactTable({
    data: props.data,
    columns: props.columns,
    manualPagination: true,
    manualSorting: true,
    state: {
      pagination: props.paginationState,
      sorting: sortingState,
    },
    pageCount: props.pageCount,
    onSortingChange: (updater) => {
      const newState = typeof updater === "function" ? updater(sortingState) : updater;
      setSortingState(newState);
      props.onSortingChange?.(newState);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowCanExpand: () => true,
  });

  const changePage = useCallback(
    (page: number) => {
      props.onPageChange?.(page);
    },
    [props.onPageChange]
  );

  const nextPage = useCallback(() => {
    props.onPageChange?.(table.getState().pagination.pageIndex + 1);
  }, [props.onPageChange, table]);

  const previousPage = useCallback(() => {
    props.onPageChange?.(table.getState().pagination.pageIndex - 1);
  }, [props.onPageChange, table]);

  const changeLimit = useCallback(
    (limit: number) => {
      props.onLimitChange?.(limit);
    },
    [props.onLimitChange]
  );

  const fixedColumnsSet = useMemo(() => new Set(props.fixedColumns), [props.fixedColumns]);

  const columnWidths = useMemo(() => {
    return props.columns.reduce(
      (acc, col) => {
        const columnId = "accessorKey" in col ? col.accessorKey : col.id;
        if (columnId) {
          acc[columnId as string] = col.size || DEFAULT_COL_SIZE;
        }
        return acc;
      },
      {} as Record<string, number>
    );
  }, [props.columns]);

  const calculatePosition = useCallback(
    (startIndex: number, direction: "left" | "right") => {
      return props.columns
        .slice(direction === "left" ? 0 : startIndex + 1, direction === "left" ? startIndex : undefined)
        .reduce((acc, col) => {
          const columnId = "accessorKey" in col ? col.accessorKey : col.id;
          return acc + (columnId ? columnWidths[columnId as string] || DEFAULT_COL_SIZE : 0);
        }, 0);
    },
    [props.columns, columnWidths]
  );

  const rightFixedColumnIndex = props.columns.findIndex(
    (col) => ("accessorKey" in col ? col.accessorKey : col.id) === props.rightFixedColumn
  );

  return (
    <>
      <ConditionalScrollShadowBox
        tableWidth={tableWidth}
        leftPosition={calculatePosition(fixedColumnsSet.size, "left")}
        rightPosition={rightFixedColumnIndex >= 0 ? calculatePosition(rightFixedColumnIndex - 1, "right") : 0}
        enableHorizontalScroll={props.enableHorizontalScroll}
      >
        <Table ref={tableRef} variant={props?.variant || "primary"} width="100%">
          <Thead>
            {table.getHeaderGroups().map((headerGroup, headerGroupIndex) => (
              <Tr key={`headerGroup_${headerGroupIndex}`}>
                {headerGroup.headers.map((header, headerIndex) => {
                  const isFixedLeft = fixedColumnsSet.has(header.column.id);
                  const isFixedRight = header.column.id === props.rightFixedColumn;
                  const columnId =
                    "accessorKey" in header.column.columnDef ? header.column.columnDef.accessorKey : header.column.id;
                  const width = columnId ? columnWidths[columnId as string] || "auto" : "auto";

                  return (
                    <Th
                      key={`header_${headerIndex}`}
                      colSpan={header.colSpan}
                      cursor={header.column.getCanSort() ? "pointer" : "default"}
                      userSelect={header.column.getCanSort() ? "none" : "initial"}
                      onClick={header.column.getToggleSortingHandler()}
                      _hover={
                        header.column.getCanSort()
                          ? {
                              backgroundColor: "grey.100",
                              "> div > .sort-icon": {
                                display: "inline-block",
                                color: "black",
                              },
                            }
                          : undefined
                      }
                      w={`${width}px`}
                      paddingBottom={3}
                      position={isFixedLeft || isFixedRight ? "sticky" : undefined}
                      left={isFixedLeft ? `${calculatePosition(headerIndex, "left")}px` : undefined}
                      right={isFixedRight ? `${calculatePosition(headerIndex, "right")}px` : undefined}
                      zIndex={isFixedLeft || isFixedRight ? 1 : undefined}
                      bg={isFixedLeft || isFixedRight ? "white" : undefined}
                    >
                      {header.isPlaceholder ? null : (
                        <Flex justify="space-between" align="center">
                          <Box>{flexRender(header.column.columnDef.header, header.getContext())}</Box>
                          <Box
                            ml={2}
                            className="sort-icon"
                            display={header.column.getCanSort() ? "inline-block" : "none"}
                          >
                            {header.column.getIsSorted() === "desc" && <Box as="span">▲</Box>}
                            {header.column.getIsSorted() === "asc" && <Box as="span">▼</Box>}
                            {header.column.getIsSorted() === false && (
                              <Box as="span" color="grey.400">
                                ▼
                              </Box>
                            )}
                          </Box>
                        </Flex>
                      )}
                    </Th>
                  );
                })}
              </Tr>
            ))}
          </Thead>
          <Tbody>
            {props.loading ? (
              <RowsSkeleton nbRows={5} nbColumns={props.columns.length} height={`${DEFAULT_ROW_HEIGHT}px`} />
            ) : table.getRowModel().rows.length === 0 ? (
              <Tr key="noDataRow" _hover={{ backgroundColor: "inherit !important" }}>
                <Td
                  key="noDataCell"
                  colSpan={99}
                  h={`${DEFAULT_ROW_HEIGHT}px`}
                  textAlign="center"
                  padding={3}
                  height={props.isRowExpanded ? "auto" : `${DEFAULT_ROW_HEIGHT}px`}
                >
                  {props.noDataMessage ?? "Aucun résultat"}
                </Td>
              </Tr>
            ) : (
              table.getRowModel().rows.map((row, rowIndex) => {
                const rowBg = rowIndex % 2 === 0 ? "gray.50" : "white";
                return (
                  <Fragment key={`fragment_${rowIndex}`}>
                    <Tr
                      key={`row_${rowIndex}`}
                      borderLeftWidth={row.original.prominent ? "4px" : ""}
                      borderLeftColor="blue_cumulus_main"
                      bg={rowBg}
                      height={props.isRowExpanded ? "auto" : `${DEFAULT_ROW_HEIGHT}px`}
                    >
                      {row.getVisibleCells().map((cell, cellIndex) => {
                        const isFixedLeft = fixedColumnsSet.has(cell.column.id);
                        const isFixedRight = cell.column.id === props.rightFixedColumn;
                        const columnId =
                          "accessorKey" in cell.column.columnDef ? cell.column.columnDef.accessorKey : cell.column.id;
                        const width = columnId ? columnWidths[columnId as string] || "auto" : "auto";

                        return (
                          <Td
                            key={`cellContent_${cellIndex}`}
                            position={isFixedLeft || isFixedRight ? "sticky" : undefined}
                            left={isFixedLeft ? `${calculatePosition(cellIndex, "left")}px` : undefined}
                            right={isFixedRight ? `${calculatePosition(cellIndex, "right")}px` : undefined}
                            zIndex={isFixedLeft || isFixedRight ? 1 : undefined}
                            bg={rowBg}
                            minW={props.enableHorizontalScroll ? (width === "auto" ? "auto" : `${width}px`) : undefined}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </Td>
                        );
                      })}
                    </Tr>

                    {row.getIsExpanded() && (
                      <Tr key={`rowExpanded_${rowIndex}`}>
                        <Td colSpan={row.getVisibleCells().length} bg={rowBg}>
                          {props?.renderSubComponent?.(row)}
                        </Td>
                      </Tr>
                    )}

                    {props.renderDivider && (
                      <Tr key={`rowDivider_${rowIndex}`}>
                        <Td colSpan={row.getVisibleCells().length} bg={rowBg}>
                          {props?.renderDivider?.()}
                        </Td>
                      </Tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </Tbody>
        </Table>
      </ConditionalScrollShadowBox>

      {(props.showPagination ?? true) && (
        <HStack mt={8} spacing={3} justifyContent="space-between">
          <HStack spacing={3}>
            <Button variant="unstyled" onClick={() => changePage(0)} isDisabled={!table.getCanPreviousPage()}>
              <FirstPageIcon />
            </Button>
            <Button variant="unstyled" onClick={() => previousPage()} isDisabled={!table.getCanPreviousPage()}>
              <ChevronLeftIcon />
            </Button>
            {table.getState().pagination.pageIndex - 1 > 0 && (
              <Button variant="unstyled" onClick={() => changePage(table.getState().pagination.pageIndex - 2)}>
                {table.getState().pagination.pageIndex - 1}
              </Button>
            )}
            {table.getState().pagination.pageIndex > 0 && (
              <Button variant="unstyled" onClick={() => previousPage()}>
                {table.getState().pagination.pageIndex}
              </Button>
            )}
            <Button bg="bluefrance" color="white" pointerEvents="none" fontSize="zeta">
              {table.getState().pagination.pageIndex + 1}
            </Button>
            {table.getCanNextPage() && (
              <Button variant="unstyled" onClick={() => nextPage()}>
                {table.getState().pagination.pageIndex + 2}
              </Button>
            )}
            {table.getState().pagination.pageIndex + 2 < table.getPageCount() && (
              <Button variant="unstyled" onClick={() => changePage(table.getState().pagination.pageIndex + 2)}>
                {table.getState().pagination.pageIndex + 3}
              </Button>
            )}
            <Button variant="unstyled" onClick={() => nextPage()} isDisabled={!table.getCanNextPage()}>
              <ChevronRightIcon />
            </Button>
            <Button
              variant="unstyled"
              onClick={() => changePage(table.getPageCount() - 1)}
              isDisabled={!table.getCanNextPage()}
            >
              <LastPageIcon />
            </Button>
          </HStack>
          <HStack spacing={3} justifyContent="flex-end">
            <Select
              variant="filled"
              fontSize="zeta"
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                changeLimit(Number(e.target.value));
              }}
            >
              {[5, 10, 20, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  Voir par {pageSize}
                </option>
              ))}
            </Select>
          </HStack>
        </HStack>
      )}
    </>
  );
};

export default TableWithPagination;
