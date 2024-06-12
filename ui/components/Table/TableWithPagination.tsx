import { Box, Button, HStack, Select, SystemProps, Table, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";
import {
  ColumnDef,
  PaginationState,
  Row,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Fragment, useMemo } from "react";

import RowsSkeleton from "@/components/skeletons/RowsSkeleton";
import { useDraggableScroll } from "@/hooks/useDraggableScroll";

import { ChevronLeftIcon, ChevronRightIcon, FirstPageIcon, LastPageIcon } from "../../modules/dashboard/icons";
import { ScrollShadowBox } from "../ScrollShadowBox/ScrollShadowBox";

const DEFAULT_COL_SIZE = 150;

interface TableWithPaginationProps<T> extends SystemProps {
  columns: ColumnDef<T, any>[];
  data: T[];
  noDataMessage?: string;
  loading?: boolean;
  isRowExpanded?: boolean;
  sortingState?: SortingState;
  paginationState?: PaginationState;
  variant?: string;
  showPagination?: boolean;
  pageCount: number;
  onSortingChange?: (state: SortingState) => any;
  renderSubComponent?: (row: Row<T>) => React.ReactElement;
  renderDivider?: () => React.ReactElement;
  onPageChange?: (page: number) => any;
  onLimitChange?: (limit: number) => any;
  fixedColumns?: string[];
  rightFixedColumn?: string;
}

function TableWithPagination<T>(props: TableWithPaginationProps<T & { prominent?: boolean }>) {
  const { ref } = useDraggableScroll();
  const table = useReactTable({
    data: props.data,
    columns: props.columns,
    manualPagination: true,
    state: {
      pagination: props.paginationState,
      sorting: props.sortingState,
    },
    pageCount: props.pageCount,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowCanExpand: () => true,
  });

  const changePage = (page: number) => {
    props.onPageChange?.(page);
  };

  const nextPage = () => {
    props.onPageChange?.(table.getState().pagination.pageIndex + 1);
  };

  const previousPage = () => {
    props.onPageChange?.(table.getState().pagination.pageIndex - 1);
  };

  const changeLimit = (limit: number) => {
    props.onLimitChange?.(limit);
  };

  const fixedColumnsSet = new Set(props.fixedColumns);

  const columnWidths = useMemo(() => {
    return props.columns.reduce(
      (acc, col) => {
        const columnId = "accessorKey" in col ? col.accessorKey : col.id;
        if (columnId) {
          acc[columnId] = col.size || DEFAULT_COL_SIZE;
        }
        return acc;
      },
      {} as Record<string, number>
    );
  }, [props.columns]);

  const calculateLeftPosition = (index: number) => {
    return props.columns.slice(0, index).reduce((acc, col) => {
      const columnId = "accessorKey" in col ? col.accessorKey : col.id;
      return acc + (columnId ? columnWidths[columnId] || DEFAULT_COL_SIZE : 0);
    }, 0);
  };

  const calculateRightPosition = (index: number) => {
    return props.columns.slice(index + 1).reduce((acc, col) => {
      const columnId = "accessorKey" in col ? col.accessorKey : col.id;
      return acc + (columnId ? columnWidths[columnId] || DEFAULT_COL_SIZE : 0);
    }, 0);
  };

  const tableWidth = useMemo(() => {
    return props.columns.reduce((acc, col) => {
      const columnId = "accessorKey" in col ? col.accessorKey : col.id;
      return acc + (columnId ? columnWidths[columnId] || DEFAULT_COL_SIZE : 0);
    }, 0);
  }, [props.columns, columnWidths]);

  return (
    <>
      <Box overflowX="auto" width="100%">
        <ScrollShadowBox
          scrollRef={ref}
          left={fixedColumnsSet.size ? `${calculateLeftPosition(fixedColumnsSet.size)}px` : "0px"}
          right="75px"
          bottom="16px"
        >
          <Box
            ref={ref}
            position="relative"
            overflowX="auto"
            width="100%"
            maxWidth={`${tableWidth}px`}
            cursor={"grab"}
            userSelect="none"
          >
            <Table variant={props?.variant || "primary"} width="100%">
              <Thead>
                {table.getHeaderGroups().map((headerGroup, headerGroupIndex) => (
                  <Tr key={`headerGroup_${headerGroupIndex}`}>
                    {headerGroup.headers.map((header, headerIndex) => {
                      const isFixedLeft = fixedColumnsSet.has(header.column.id);
                      const isFixedRight = header.column.id === props.rightFixedColumn;
                      const columnId =
                        "accessorKey" in header.column.columnDef
                          ? header.column.columnDef.accessorKey
                          : header.column.id;
                      const width = columnId ? columnWidths[columnId] || DEFAULT_COL_SIZE : DEFAULT_COL_SIZE;
                      const left = isFixedLeft ? calculateLeftPosition(headerIndex) : undefined;
                      const right = isFixedRight ? calculateRightPosition(headerIndex) : undefined;

                      return (
                        <Th
                          key={`header_${headerIndex}`}
                          colSpan={header.colSpan}
                          cursor={header.column.getCanSort() ? "pointer" : "default"}
                          userSelect={header.column.getCanSort() ? "none" : "initial"}
                          onClick={header.column.getToggleSortingHandler()}
                          _hover={
                            header.column.getCanSort() && !header.column.getIsSorted()
                              ? {
                                  backgroundColor: "grey.100",
                                  "::after": {
                                    color: "grey.500",
                                    content: '"▼"',
                                    marginLeft: "-14px",
                                  },
                                }
                              : undefined
                          }
                          w={`${width}px`}
                          position={isFixedLeft || isFixedRight ? "sticky" : undefined}
                          left={isFixedLeft ? `${left}px` : undefined}
                          right={isFixedRight ? `${right}px` : undefined}
                          zIndex={isFixedLeft || isFixedRight ? 1 : undefined}
                          bg={isFixedLeft || isFixedRight ? "white" : undefined}
                        >
                          {header.isPlaceholder ? null : (
                            <>
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              <Box as="span" display="inline-block" w="14px">
                                {{
                                  asc: "▲",
                                  desc: "▼",
                                }[header.column.getIsSorted() as string] ?? null}
                              </Box>
                            </>
                          )}
                        </Th>
                      );
                    })}
                  </Tr>
                ))}
              </Thead>
              <Tbody>
                {props.loading ? (
                  <RowsSkeleton nbRows={5} nbColumns={props.columns.length} height="50px" />
                ) : table.getRowModel().rows.length === 0 ? (
                  <Tr key="noDataRow" _hover={{ backgroundColor: "inherit !important" }}>
                    <Td key="noDataCell" colSpan={99} h="50px" textAlign="center">
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
                        >
                          {row.getVisibleCells().map((cell, cellIndex) => {
                            const isFixedLeft = fixedColumnsSet.has(cell.column.id);
                            const isFixedRight = cell.column.id === props.rightFixedColumn;
                            const columnId =
                              "accessorKey" in cell.column.columnDef
                                ? cell.column.columnDef.accessorKey
                                : cell.column.id;
                            const width = columnId ? columnWidths[columnId] || DEFAULT_COL_SIZE : DEFAULT_COL_SIZE;
                            const left = isFixedLeft ? calculateLeftPosition(cellIndex) : undefined;
                            const right = isFixedRight ? calculateRightPosition(cellIndex) : undefined;

                            return (
                              <Td
                                key={`cellContent_${cellIndex}`}
                                position={isFixedLeft || isFixedRight ? "sticky" : undefined}
                                left={isFixedLeft ? `${left}px` : undefined}
                                right={isFixedRight ? `${right}px` : undefined}
                                zIndex={isFixedLeft || isFixedRight ? 1 : undefined}
                                bg={rowBg}
                                minW={`${width}px`}
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
          </Box>
        </ScrollShadowBox>
      </Box>

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
}

export default TableWithPagination;
