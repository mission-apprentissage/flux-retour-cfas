import React, { Fragment } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Box } from "@chakra-ui/react";

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
  });

  return (
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
  );
}
