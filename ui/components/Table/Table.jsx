import React from "react";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Box } from "@chakra-ui/react";

export default function Table({ data: defaultData, onRowClick, columns: columnsDef, ...props }) {
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
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Box as="table" flex={1} fontSize="delta" w="100%" {...props}>
      <Box as="thead">
        {table.getHeaderGroups().map((headerGroup, key) => (
          <Box as="tr" key={key} borderBottom="3px solid" borderColor="bluefrance">
            {headerGroup.headers.map((header) => (
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
            ))}
          </Box>
        ))}
      </Box>
      <Box as="tbody">
        {table.getRowModel().rows.map((row, j) => (
          <Box
            as="tr"
            key={row.id}
            data-rowindex={row.id}
            onClick={() => onRowClick?.(row.id)}
            bg={j % 2 === 0 ? "galt" : "white"}
            py="3"
          >
            {row.getVisibleCells().map((cell) => (
              <Box as="td" key={cell.id} overflow="hidden">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
