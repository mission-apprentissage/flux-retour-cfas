import { Box, Button, Table, Thead, Tbody, Tr, Th, Td, Select, HStack } from "@chakra-ui/react";
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  PaginationState,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import React, { useEffect, useState } from "react";

import { ChevronLeftIcon, ChevronRightIcon, FirstPageIcon, LastPageIcon } from "@/modules/dashboard/icons";
import { AddFill, SubtractLine } from "@/theme/components/icons";

interface CustomTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  renderRowSubComponent?: (params: { row: TData }) => React.ReactNode;
  pageCount?: number;
  showPagination?: boolean;
  sortingState?: SortingState;
  paginationState?: PaginationState;
  onSortingChange?: (state: SortingState) => any;
  onPageChange?: (page: number) => any;
  onPageSizeChange?: (limit: number) => any;
}

function CustomTable<TData extends object>({
  columns,
  data,
  renderRowSubComponent,
  showPagination,
  pageCount,
  sortingState,
  paginationState,
  onPageChange,
  onPageSizeChange,
}: CustomTableProps<TData>) {
  const [expanded, setExpanded] = useState<string | null>();

  useEffect(() => {
    setExpanded(null);
  }, [data]);

  const table = useReactTable({
    columns,
    data,
    state: {
      pagination: paginationState,
      sorting: sortingState,
    },
    manualPagination: true,
    pageCount: pageCount,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const changePage = (page: number) => {
    onPageChange?.(page);
  };

  const nextPage = () => {
    onPageChange?.(table.getState().pagination.pageIndex + 1);
  };

  const previousPage = () => {
    onPageChange?.(table.getState().pagination.pageIndex - 1);
  };

  const totalColumns = columns.length + (renderRowSubComponent ? 1 : 0);

  return (
    <Box overflowX="auto">
      <Table variant="simple">
        <Thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <Tr key={headerGroup.id} borderBottom="3px solid" borderColor="bluefrance">
              {renderRowSubComponent && <Th width={10}></Th>}
              {headerGroup.headers.map((header) => (
                <Th
                  key={header.id}
                  fontWeight="bold"
                  fontSize="0.9rem"
                  overflow="hidden"
                  borderColor="grey.800"
                  color="grey.800"
                  textTransform="none"
                  letterSpacing="0"
                  wordBreak="break-word"
                  textAlign="left"
                  p={2}
                >
                  {typeof header.column.columnDef.header === "function"
                    ? header.column.columnDef.header(header.getContext())
                    : header.column.columnDef.header}
                </Th>
              ))}
            </Tr>
          ))}
        </Thead>
        <Tbody>
          {table.getRowModel().rows.map((row, rowIndex) => (
            <React.Fragment key={row.id}>
              <Tr
                onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                cursor="pointer"
                bg={rowIndex % 2 === 0 ? "blackAlpha.100" : "white"}
                borderBottom={0}
                _hover={{ bg: "gray.100" }}
              >
                {renderRowSubComponent && (
                  <Td borderBottom={0} py={1} px={0}>
                    <Button>
                      {row.getIsExpanded() ? (
                        <SubtractLine fontSize="12px" color="bluefrance" />
                      ) : (
                        <AddFill fontSize="12px" color="bluefrance" />
                      )}
                    </Button>
                  </Td>
                )}
                {row.getVisibleCells().map((cell) => (
                  <Td key={cell.id} borderBottom={0} p={2}>
                    {typeof cell.column.columnDef.cell === "function"
                      ? cell.column.columnDef.cell(cell.getContext())
                      : cell.column.columnDef.cell}
                  </Td>
                ))}
              </Tr>
              {expanded === row.id && renderRowSubComponent && (
                <Tr>
                  <Td colSpan={totalColumns}>{renderRowSubComponent({ row: row.original })}</Td>
                </Tr>
              )}
            </React.Fragment>
          ))}
        </Tbody>
      </Table>
      {(showPagination ?? true) && (
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
                const newPageSize = Number(e.target.value);
                onPageSizeChange?.(newPageSize);
              }}
            >
              {[5, 10, 20, 50].map((pageSizeOption) => (
                <option key={pageSizeOption} value={pageSizeOption}>
                  Voir par {pageSizeOption}
                </option>
              ))}
            </Select>
          </HStack>
        </HStack>
      )}
    </Box>
  );
}

export default CustomTable;
