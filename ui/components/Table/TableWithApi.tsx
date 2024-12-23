import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { Box, Button, Flex, HStack, Select, SystemProps, Table, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";
import {
  ColumnDef,
  PaginationState,
  Row,
  SortingState,
  flexRender,
  functionalUpdate,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Fragment, useState, useMemo } from "react";

import { FirstPageIcon, LastPageIcon } from "@/modules/dashboard/icons";
import { AddFill, SubtractLine } from "@/theme/components/icons";

const DEFAULT_COL_SIZE = 220;

interface TableWithApiProps<T> extends SystemProps {
  columns: ColumnDef<T, any>[];
  data: T[];
  total?: number;
  noDataMessage?: string;
  expandAllRows?: boolean;
  enableRowExpansion?: boolean;
  sortingState?: SortingState;
  paginationState?: PaginationState;
  variant?: string;
  showPagination?: boolean;
  isLoading?: boolean;
  onSortingChange?: (state: SortingState) => any;
  onPaginationChange?: (state: PaginationState) => any;
  renderSubComponent?: (row: Row<T>) => React.ReactElement;
  renderDivider?: () => React.ReactElement;
}

function TableWithApi<T>(props: TableWithApiProps<T & { id: string; prominent?: boolean }>) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(
    props.expandAllRows ? new Set(props.data.map((row) => row.id)) : new Set()
  );

  const totalPages = useMemo(() => {
    if (!props.total) return 1;
    return Math.ceil(props.total / (props.paginationState?.pageSize || 20));
  }, [props.total, props.paginationState?.pageSize]);

  const toggleRowExpansion = (rowId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set<string>();
      if (!prev.has(rowId)) {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

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

  const table = useReactTable({
    data: props.data,
    columns: props.columns,
    pageCount: totalPages,
    state: {
      pagination: props.paginationState ?? {
        pageIndex: 0,
        pageSize: 20,
      },
      sorting: props.sortingState,
    },
    manualPagination: true,
    onPaginationChange: (updater) => {
      const newState = functionalUpdate(updater, table.getState().pagination);
      props.onPaginationChange?.(newState);
    },
    onSortingChange: (updater) => {
      const newState = functionalUpdate(updater, table.getState().sorting);
      props.onSortingChange?.(newState);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const { pageIndex } = table.getState().pagination;

  return (
    <>
      <Table variant={props?.variant || "primary"}>
        <Thead>
          {table.getHeaderGroups().map((headerGroup, index) => (
            <Tr key={`headerGroup_${index}`}>
              {headerGroup.headers.map((header, headerIndex) => {
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
                    style={{ width }}
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
                    paddingBottom={3}
                    bg="white"
                  >
                    {header.isPlaceholder ? null : (
                      <Flex justify="space-between" align="center" width="100%">
                        <Box>{flexRender(header.column.columnDef.header, header.getContext())}</Box>
                        <Box
                          ml={2}
                          className="sort-icon"
                          display={header.column.getCanSort() ? "inline-block" : "none"}
                          w="14px"
                        >
                          {header.column.getIsSorted() === "desc" && <Box as="span">▼</Box>}
                          {header.column.getIsSorted() === "asc" && <Box as="span">▲</Box>}
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
              {props.enableRowExpansion && <Th></Th>}
            </Tr>
          ))}
        </Thead>
        <Tbody>
          {!props.data || props.data.length === 0 ? (
            <Tr key="noDataRow" _hover={{ backgroundColor: "inherit !important" }}>
              <Td key="noDataCell" colSpan={99} h="50px" textAlign="center">
                {props.noDataMessage ?? "Aucun résultat"}
              </Td>
            </Tr>
          ) : (
            table.getRowModel().rows.map((row) => {
              const isExpanded = expandedRows.has(row.original.id);

              return (
                <Fragment key={`fragment_${row.original.id}`}>
                  <Tr
                    key={`row_${row.original.id}`}
                    className={`${isExpanded ? "table-row-expanded" : ""}`}
                    onClick={() => props.enableRowExpansion && toggleRowExpansion(row.original.id)}
                    cursor={props.enableRowExpansion ? "pointer" : "default"}
                    bg={isExpanded ? "#E3E3FD" : "inherit"}
                  >
                    {row.getVisibleCells().map((cell, cellIndex) => (
                      <Td key={`cellContent_${cellIndex}`} px={3}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </Td>
                    ))}
                    {props.enableRowExpansion && (
                      <Td>
                        <Flex justifyContent="end">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpansion(row.original.id);
                            }}
                          >
                            {isExpanded ? (
                              <SubtractLine fontSize="12px" color="bluefrance" />
                            ) : (
                              <AddFill fontSize="12px" color="bluefrance" />
                            )}
                          </Button>
                        </Flex>
                      </Td>
                    )}
                  </Tr>

                  {isExpanded && props.renderSubComponent && (
                    <Tr className="expanded-row" key={`rowExpanded_${row.original.id}`}>
                      <Td colSpan={row.getVisibleCells().length + (props.enableRowExpansion ? 1 : 0)} px={0} py={3}>
                        {props.renderSubComponent(row)}
                      </Td>
                    </Tr>
                  )}

                  {props.renderDivider && (
                    <Tr key={`rowDivider_${row.original.id}`}>
                      <Td colSpan={row.getVisibleCells().length + (props.enableRowExpansion ? 1 : 0)}>
                        {props.renderDivider()}
                      </Td>
                    </Tr>
                  )}
                </Fragment>
              );
            })
          )}
        </Tbody>
      </Table>

      {props.showPagination !== false && (
        <HStack mt={8} spacing={3} justifyContent="space-between">
          <HStack spacing={3}>
            <Button variant="unstyled" onClick={() => table.setPageIndex(0)} isDisabled={!table.getCanPreviousPage()}>
              <FirstPageIcon />
            </Button>
            <Button variant="unstyled" onClick={() => table.previousPage()} isDisabled={!table.getCanPreviousPage()}>
              <ChevronLeftIcon />
            </Button>

            {pageIndex - 1 > 0 && (
              <Button variant="unstyled" onClick={() => table.setPageIndex(pageIndex - 2)}>
                {pageIndex - 1}
              </Button>
            )}
            {pageIndex > 0 && (
              <Button variant="unstyled" onClick={() => table.previousPage()}>
                {pageIndex}
              </Button>
            )}
            <Button bg="bluefrance" color="white" pointerEvents="none" fontSize="zeta">
              {pageIndex + 1}
            </Button>
            {pageIndex + 1 < totalPages && (
              <Button variant="unstyled" onClick={() => table.nextPage()}>
                {pageIndex + 2}
              </Button>
            )}
            {pageIndex + 2 < totalPages && (
              <Button variant="unstyled" onClick={() => table.setPageIndex(pageIndex + 2)}>
                {pageIndex + 3}
              </Button>
            )}

            <Button variant="unstyled" onClick={() => table.nextPage()} isDisabled={!table.getCanNextPage()}>
              <ChevronRightIcon />
            </Button>
            <Button
              variant="unstyled"
              onClick={() => table.setPageIndex(totalPages - 1)}
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
              onChange={(e) => table.setPageSize(Number(e.target.value))}
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
}

export default TableWithApi;
