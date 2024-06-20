import { Box, Flex, HStack } from "@chakra-ui/react";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import React, { useState, useMemo, useCallback } from "react";
import { normalize } from "shared";

import { televersementHeaders } from "@/common/constants/televersementHeaders";
import { formatDateNumericDayMonthYear } from "@/common/utils/dateUtils";
import TableWithPagination from "@/components/Table/TableWithPagination";
import { InfoTooltip } from "@/components/Tooltip/InfoTooltip";
import { Alert, CheckboxCircle } from "@/theme/components/icons";

import headerTooltips from "./headerTooltips";

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
  const dataWithAdditionalInfo = data.map((row, index) => ({
    lineNumber: index + 2,
    ...row,
    status: row.errors.length === 0 ? "Valide" : `${row.errors.length} erreur${row.errors.length > 1 ? "s" : ""}`,
  }));

  const [paginationState, setPaginationState] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [sortingState, setSortingState] = useState<SortingState>([]);
  const [sortedData, setSortedData] = useState(dataWithAdditionalInfo);

  const start = paginationState.pageIndex * paginationState.pageSize;
  const end = start + paginationState.pageSize;

  const handleSortingChange = useCallback(
    (newSortingState: SortingState) => {
      setSortingState(newSortingState);

      const sorted = [...dataWithAdditionalInfo].sort((a, b) => {
        for (const sort of newSortingState) {
          const { id, desc } = sort;

          const fieldA = a[id];
          const fieldB = b[id];

          if (fieldA === fieldB) continue;

          if (desc) {
            return normalize(fieldA) < normalize(fieldB) ? 1 : -1;
          } else {
            return normalize(fieldA) > normalize(fieldB) ? 1 : -1;
          }
        }
        return 0;
      });

      setSortedData(sorted);
    },
    [dataWithAdditionalInfo]
  );

  const filteredData = useMemo(() => {
    if (showOnlyColumnsAndLinesWithErrors) {
      return dataWithAdditionalInfo.filter((row) => row.errors && row.errors.length > 0);
    }
    return dataWithAdditionalInfo;
  }, [dataWithAdditionalInfo, showOnlyColumnsAndLinesWithErrors]);

  const displayedData = useMemo(() => {
    if (sortingState.length === 0) {
      return filteredData;
    }

    return sortedData;
  }, [filteredData, sortingState, sortedData]);

  const paginatedData = displayedData.slice(start, end);

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
        accessorKey: "lineNumber",
        header: () => <Header header="Ligne" />,
        cell: (info) => info.row.original.lineNumber,
        size: 100,
        enableSorting: false,
      },
      ...filteredHeaders.map((header) => ({
        accessorKey: header,
        header: () => <Header header={header} />,
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
        header: () => <Header header="Status" />,
        size: 150,
        cell: (info) => {
          const status = info.row.original.status;
          return status === "Valide" ? (
            <HStack color="#18753C">
              <Flex gap={1} justify="center" alignItems="center">
                <CheckboxCircle /> {status}
              </Flex>
            </HStack>
          ) : (
            <HStack color="#B34000">
              <Flex gap={1} justify="center" alignItems="center">
                <Alert width="18" height="18" /> {status}
              </Flex>
            </HStack>
          );
        },
      },
    ],
    [filteredHeaders, start]
  );

  const fixedColumns = ["lineNumber", "nom_apprenant"];

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
        onSortingChange={handleSortingChange}
        pageCount={Math.ceil(filteredData.length / paginationState.pageSize)}
        showPagination={true}
        fixedColumns={fixedColumns}
        rightFixedColumn="status"
        enableHorizontalScroll={true}
      />
    </>
  );
};

export default TeleversementTable;

function Header({ header }: { header: string }) {
  if (headerTooltips[header]) {
    return (
      <>
        {header}
        <InfoTooltip
          contentComponent={() => <Box padding="2w">{headerTooltips[header]}</Box>}
          aria-label="État de la donnée."
        />
      </>
    );
  }
  return <>{header}</>;
}
