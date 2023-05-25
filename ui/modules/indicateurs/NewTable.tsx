import { Box, Button, HStack, Select, SystemProps, Table, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";

import RowsSkeleton from "@/components/skeletons/RowsSkeleton";

import { ChevronLeftIcon, ChevronRightIcon, FirstPageIcon, LastPageIcon } from "../dashboard/icons";

interface NewTableProps<T> extends SystemProps {
  columns: ColumnDef<T, any>[];
  data: T[];
  loading?: boolean;
  initialSortingState?: SortingState;
}

function NewTable<T>(props: NewTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>(props.initialSortingState ?? []);

  const table = useReactTable({
    data: props.data,
    columns: props.columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    debugTable: true,
  });

  return (
    <>
      <Table variant="primary">
        <Thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <Tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <Th
                    key={header.id}
                    colSpan={header.colSpan}
                    cursor={header.column.getCanSort() ? "pointer" : "default"}
                    userSelect={header.column.getCanSort() ? "none" : "initial"}
                    onClick={header.column.getToggleSortingHandler()}
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
          ) : (
            table.getRowModel().rows.map((row) => {
              return (
                <Tr key={row.id}>
                  {row.getVisibleCells().map((cell) => {
                    return <Td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</Td>;
                  })}
                </Tr>
              );
            })
          )}
        </Tbody>
      </Table>

      <HStack mt={8} spacing={3} justifyContent="space-between">
        <HStack spacing={3}>
          <Button variant="unstyled" onClick={() => table.setPageIndex(0)} isDisabled={!table.getCanPreviousPage()}>
            <FirstPageIcon />
          </Button>
          <Button variant="unstyled" onClick={() => table.previousPage()} isDisabled={!table.getCanPreviousPage()}>
            <ChevronLeftIcon />
          </Button>

          <Button bg="bluefrance" color="white" pointerEvents="none" fontSize="zeta">
            {table.getState().pagination.pageIndex + 1}
          </Button>

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
    </>
  );
}

export default NewTable;
