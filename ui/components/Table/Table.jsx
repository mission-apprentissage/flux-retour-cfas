import React, { Fragment } from "react";
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
import { Box, Button, HStack, Input } from "@chakra-ui/react";

import { rankItem } from "@tanstack/match-sorter-utils";

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

function DebouncedInput({ value: initialValue, onChange, debounce = 500, ...props }) {
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [debounce, onChange, value]);

  return <Input {...props} value={value} onChange={(e) => setValue(e.target.value)} />;
}

export default function Table({
  data: defaultData,
  onRowClick,
  columns: columnsDef,
  renderSubComponent,
  getRowCanExpand,
  ...props
}) {
  const data = React.useMemo(
    () => defaultData,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [globalFilter, setGlobalFilter] = React.useState("");

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
  });

  return (
    <>
      <DebouncedInput
        value={globalFilter ?? ""}
        onChange={(value) => setGlobalFilter(String(value))}
        className="p-2 font-lg shadow border border-block"
        placeholder="Search all columns..."
      />
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
      <HStack spacing={2}>
        <Button
          className="border rounded p-1"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          {"<<"}
        </Button>
        <Button
          className="border rounded p-1"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {"<"}
        </Button>
        <Button className="border rounded p-1" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          {">"}
        </Button>
        <Button
          className="border rounded p-1"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          {">>"}
        </Button>
        <HStack className="flex items-center gap-1">
          <div>Page</div>
          <strong>
            {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </strong>
        </HStack>
        <HStack className="flex items-center gap-1">
          <Box>| Go to page:</Box>
          <Input
            type="number"
            defaultValue={table.getState().pagination.pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              table.setPageIndex(page);
            }}
            className="border p-1 rounded w-16"
          />
        </HStack>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}
        >
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </HStack>
    </>
  );
}
