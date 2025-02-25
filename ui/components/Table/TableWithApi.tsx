import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { Box, Button, Flex, HStack, Select, SystemProps, Table, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";
import {
  ColumnDef,
  Row,
  flexRender,
  functionalUpdate,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Fragment, useState, useMemo } from "react";
import { IPaginationFilters } from "shared/models/routes/pagination";

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
  paginationState: IPaginationFilters;
  variant?: string;
  showPagination?: boolean;
  isLoading?: boolean;
  onTableChange: (state: IPaginationFilters) => any;
  renderSubComponent?: (row: Row<T>) => React.ReactElement;
  renderDivider?: () => React.ReactElement;
  enableSorting?: boolean;
}

function TableWithApi<T>(props: TableWithApiProps<T & { id: string; prominent?: boolean }>) {
  const paginationState = props.paginationState;
  const page = paginationState.page ?? 0;
  const limit = paginationState.limit ?? 10;
  const enableSorting = props.enableSorting === undefined ? true : props.enableSorting;
  const [expandedRows, setExpandedRows] = useState<Set<string>>(
    props.expandAllRows ? new Set(props.data.map((row) => row.id)) : new Set()
  );

  const totalPages = useMemo(() => (props.total ? Math.ceil(props.total / limit) : 1), [props.total, limit]);

  const toggleRowExpansion = (rowId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  const columnWidths = useMemo(
    () =>
      props.columns.reduce(
        (acc, col) => {
          const columnId = "accessorKey" in col ? col.accessorKey : col.id;
          if (columnId) acc[columnId as string] = col.size || DEFAULT_COL_SIZE;
          return acc;
        },
        {} as Record<string, number>
      ),
    [props.columns]
  );

  const table = useReactTable({
    data: props.data,
    columns: props.columns,
    pageCount: totalPages,
    state: {
      pagination: { pageIndex: page, pageSize: limit },
      sorting: [{ id: paginationState?.sort || "", desc: paginationState?.order === "desc" }],
    },
    manualPagination: true,
    manualSorting: true,
    enableSorting,
    onStateChange: (updater) => {
      const newState = functionalUpdate(updater, table.getState());
      const { pagination, sorting } = newState;
      props.onTableChange({
        limit: pagination.pageSize,
        page: pagination.pageIndex,
        sort: sorting[0]?.id,
        order: sorting[0]?.desc ? "desc" : "asc",
      });
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const { pageIndex } = table.getState().pagination;

  return (
    <>
      <Box>
        <Table variant={props?.variant || "primary"}>
          <Thead>
            {table.getHeaderGroups().map((headerGroup, index) => (
              <Tr key={`headerGroup_${index}`}>
                {headerGroup.headers.map((header, headerIndex) => {
                  const columnId =
                    "accessorKey" in header.column.columnDef ? header.column.columnDef.accessorKey : header.column.id;
                  const width = columnId ? `${columnWidths[columnId as string]}px` : `${DEFAULT_COL_SIZE}px`;

                  return (
                    <Th
                      key={`header_${headerIndex}`}
                      colSpan={header.colSpan}
                      cursor={header.column.getCanSort() ? "pointer" : "default"}
                      userSelect={header.column.getCanSort() ? "none" : "initial"}
                      onClick={header.column.getToggleSortingHandler()}
                      style={{ width, minWidth: width, maxWidth: width }}
                      _hover={
                        header.column.getCanSort()
                          ? {
                              backgroundColor: "gray.100",
                              "> div > .sort-icon": { display: "inline-block", color: "black" },
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
                              <Box as="span" color="gray.400">
                                ▼
                              </Box>
                            )}
                          </Box>
                        </Flex>
                      )}
                    </Th>
                  );
                })}
                {props.enableRowExpansion && <Th />}
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
                      {row.getVisibleCells().map((cell, cellIndex) => {
                        const columnId =
                          "accessorKey" in cell.column.columnDef ? cell.column.columnDef.accessorKey : cell.column.id;
                        const width = columnId ? `${columnWidths[columnId as string]}px` : `${DEFAULT_COL_SIZE}px`;

                        return (
                          <Td
                            key={`cellContent_${cellIndex}`}
                            px={3}
                            style={{
                              width,
                              minWidth: width,
                              maxWidth: width,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </Td>
                        );
                      })}
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
      </Box>

      {props.showPagination !== false && (
        <HStack mt={8} spacing={3} justifyContent="space-between">
          <HStack spacing={3}>
            <Button variant="unstyled" onClick={() => table.setPageIndex(0)} isDisabled={!table.getCanPreviousPage()}>
              <FirstPageIcon />
            </Button>
            <Button variant="unstyled" onClick={() => table.previousPage()} isDisabled={!table.getCanPreviousPage()}>
              <ChevronLeftIcon />
            </Button>

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

          <HStack spacing={3}>
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
