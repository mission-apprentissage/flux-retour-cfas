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
import { Fragment } from "react";

import RowsSkeleton from "@/components/skeletons/RowsSkeleton";

import { ChevronLeftIcon, ChevronRightIcon, FirstPageIcon, LastPageIcon } from "../../modules/dashboard/icons";

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
}

function TableWithPagination<T>(props: TableWithPaginationProps<T & { prominent?: boolean }>) {
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

  return (
    <>
      <Table variant={props?.variant || "primary"}>
        <Thead>
          {table.getHeaderGroups().map((headerGroup, index) => (
            <Tr key={`headerGroup_${index}`}>
              {headerGroup.headers.map((header, index) => {
                return (
                  <Th
                    key={`header${index}`}
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
                              marginLeft: "-14px", // Negative margin to pull icon to the left, based on following Box
                            },
                          }
                        : undefined
                    }
                    w={header.getSize()}
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
            table.getRowModel().rows.map((row, index) => {
              return (
                <Fragment key={`fragment_${index}`}>
                  <Tr
                    key={`row_${index}`}
                    borderLeftWidth={row.original.prominent ? "4px" : ""}
                    borderLeftColor="blue_cumulus_main"
                  >
                    {row.getVisibleCells().map((cell, index) => {
                      return (
                        <Td key={`cellContent_${index}`}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </Td>
                      );
                    })}
                  </Tr>

                  {row.getIsExpanded() && (
                    <Tr key={`rowExpanded_${index}`}>
                      <Td colSpan={row.getVisibleCells().length}>{props?.renderSubComponent?.(row)}</Td>
                    </Tr>
                  )}

                  {props.renderDivider && (
                    <Tr key={`rowDivider_${index}`}>
                      <Td colSpan={row.getVisibleCells().length}>{props?.renderDivider?.()}</Td>
                    </Tr>
                  )}
                </Fragment>
              );
            })
          )}
        </Tbody>
      </Table>

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
