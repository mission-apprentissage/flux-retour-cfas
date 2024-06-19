import { Box, Flex, HStack } from "@chakra-ui/react";
import { ColumnDef } from "@tanstack/react-table";
import React, { useState, useMemo } from "react";

import { televersementHeaders } from "@/common/constants/televersementHeaders";
import { formatDateNumericDayMonthYear } from "@/common/utils/dateUtils";
import TableWithPagination from "@/components/Table/TableWithPagination";
import { Alert, CheckboxCircle } from "@/theme/components/icons";

interface TeleversementTableProps {
  data: any[];
  headers: string[];
  columnsWithErrors: string[];
  showOnlyColumnsAndLinesWithErrors: boolean;
}

function fromIsoLikeDateStringToFrenchDate(date: string) {
  if (!date || String(date) !== date) return date;
  if (date.match(/^(\d{4})-(\d{2})-(\d{2})$/)) {
    return formatDateNumericDayMonthYear(date);
  }
}

const TeleversementTable: React.FC<TeleversementTableProps> = ({
  data,
  headers,
  columnsWithErrors,
  showOnlyColumnsAndLinesWithErrors,
}) => {
  const [paginationState, setPaginationState] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const start = paginationState.pageIndex * paginationState.pageSize;
  const end = start + paginationState.pageSize;

  const filteredData = useMemo(() => {
    if (showOnlyColumnsAndLinesWithErrors) {
      return data.filter((row) => row.errors && row.errors.length > 0);
    }
    return data;
  }, [data, showOnlyColumnsAndLinesWithErrors]);

  const paginatedData = filteredData.slice(start, end);

  const filteredHeaders = useMemo(() => {
    if (showOnlyColumnsAndLinesWithErrors && columnsWithErrors.length) {
      const fixedColumns = ["nom_apprenant", "prenom_apprenant"];
      return [
        ...fixedColumns,
        ...headers.filter((header) => columnsWithErrors.includes(header) && !fixedColumns.includes(header)),
      ];
    } else {
      return headers;
    }
  }, [headers, columnsWithErrors, showOnlyColumnsAndLinesWithErrors]);

  const isDateField = (header: string) => televersementHeaders[header]?.type === "date";

  const columns: ColumnDef<any, any>[] = useMemo(
    () => [
      {
        accessorKey: "line",
        header: "Ligne",
        cell: (info) => info.row.index + 2 + start,
        size: 75,
      },
      ...filteredHeaders.map((header) => ({
        accessorKey: header,
        header,
        cell: (info) => {
          const row = info.row.original;
          const value = isDateField(header) ? fromIsoLikeDateStringToFrenchDate(row[header]) : row[header];
          const error = row.errors.find((e: any) => e.key === header);
          return (
            <Box>
              <Box>{value}</Box>
              {error && <Box color="red.500">{error.message.replace("String", "Texte")}</Box>}
            </Box>
          );
        },
      })),
      {
        accessorKey: "status",
        header: "Statut",
        size: 120,
        cell: (info) => {
          const errors = info.row.original.errors;
          return errors.length === 0 ? (
            <HStack color="#18753C">
              <Flex gap={1} justify="center" alignItems="center">
                <CheckboxCircle /> Valide
              </Flex>
            </HStack>
          ) : (
            <HStack color="#B34000">
              <Flex gap={1} justify="center" alignItems="center">
                <Alert width="18" height="18" /> {errors.length} erreur{errors.length > 1 ? "s" : ""}
              </Flex>
            </HStack>
          );
        },
      },
    ],
    [filteredHeaders, start]
  );

  const fixedColumns = ["line", "nom_apprenant"];

  return (
    <>
      <Box pb={5}>
        Votre fichier inclut <strong>{filteredData.length || "N/A"} lignes</strong>
      </Box>
      <TableWithPagination
        columns={columns}
        data={paginatedData}
        paginationState={paginationState}
        onPageChange={(pageIndex) => setPaginationState((prev) => ({ ...prev, pageIndex }))}
        onLimitChange={(pageSize) => setPaginationState((prev) => ({ ...prev, pageSize, pageIndex: 0 }))}
        pageCount={Math.ceil(filteredData.length / paginationState.pageSize)}
        showPagination={true}
        fixedColumns={fixedColumns}
        rightFixedColumn="status"
      />
    </>
  );
};

export default TeleversementTable;
