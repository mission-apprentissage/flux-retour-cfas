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
import { Fragment, useState } from "react";

import RowsSkeleton from "@/components/skeletons/RowsSkeleton";

import { ChevronLeftIcon, ChevronRightIcon, FirstPageIcon, LastPageIcon } from "../dashboard/icons";

interface NewTableProps<T> extends SystemProps {
  columns: ColumnDef<T, any>[];
  data: T[];
  noDataMessage?: string;
  loading?: boolean;
  isRowExpanded?: boolean;
  sortingState?: SortingState;
  paginationState?: PaginationState;
  variant?: string;
  showPagination?: boolean;
  onSortingChange?: (state: SortingState) => any;
  onPaginationChange?: (state: PaginationState) => any;
  renderSubComponent?: (row: Row<T>) => React.ReactElement;
  renderDivider?: () => React.ReactElement;
}

function NewTable<T>(props: NewTableProps<T & { prominent?: boolean }>) {
  const [pagination, setPagination] = useState<PaginationState>(
    props.paginationState ?? {
      pageIndex: 0,
      pageSize: 20,
    }
  );

  const table = useReactTable({
    data: props.data,
    columns: props.columns,
    state: {
      pagination: pagination,
      sorting: props.sortingState,
    },
    onPaginationChange: (updater) => {
      const newState = functionalUpdate(updater, table.getState().pagination);
      setPagination(newState);
    },
    onSortingChange: (updater) => {
      const newState = functionalUpdate(updater, table.getState().sorting);
      props.onSortingChange?.(newState);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <>
      <Table variant={props?.variant || "primary"}>
        <Thead>
          {table.getHeaderGroups().map((headerGroup, index) => (
            <Tr key={`headerGroup_${index}`}>
              {headerGroup.headers.map((header, headerIndex) => {
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
                    paddingBottom={3}
                    bg="white"
                  >
                    {header.isPlaceholder ? null : (
                      <Flex justify="space-between" align="center">
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

                  {props.isRowExpanded && (
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
            <Button variant="unstyled" onClick={() => table.setPageIndex(0)} isDisabled={!table.getCanPreviousPage()}>
              <FirstPageIcon />
            </Button>
            <Button variant="unstyled" onClick={() => table.previousPage()} isDisabled={!table.getCanPreviousPage()}>
              <ChevronLeftIcon />
            </Button>

            {table.getState().pagination.pageIndex - 1 > 0 && (
              <Button variant="unstyled" onClick={() => table.setPageIndex(table.getState().pagination.pageIndex - 2)}>
                {table.getState().pagination.pageIndex - 1}
              </Button>
            )}
            {table.getState().pagination.pageIndex > 0 && (
              <Button variant="unstyled" onClick={() => table.previousPage()}>
                {table.getState().pagination.pageIndex}
              </Button>
            )}
            <Button bg="bluefrance" color="white" pointerEvents="none" fontSize="zeta">
              {table.getState().pagination.pageIndex + 1}
            </Button>
            {table.getCanNextPage() && (
              <Button variant="unstyled" onClick={() => table.nextPage()}>
                {table.getState().pagination.pageIndex + 2}
              </Button>
            )}
            {table.getState().pagination.pageIndex + 2 < table.getPageCount() && (
              <Button variant="unstyled" onClick={() => table.setPageIndex(table.getState().pagination.pageIndex + 2)}>
                {table.getState().pagination.pageIndex + 3}
              </Button>
            )}

            <Button variant="unstyled" onClick={() => table.nextPage()} isDisabled={!table.getCanNextPage()}>
              <ChevronRightIcon />
            </Button>
            <Button
              variant="unstyled"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
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
                table.setPageSize(Number(e.target.value));
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

export default NewTable;
