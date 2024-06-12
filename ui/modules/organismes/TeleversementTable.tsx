import { Box, HStack } from "@chakra-ui/react";
import { ColumnDef } from "@tanstack/react-table";
import React, { useState, useMemo } from "react";

import { formatDateNumericDayMonthYear } from "@/common/utils/dateUtils";
import TableWithPagination from "@/components/Table/TableWithPagination";

const dateFields = [
  "date_de_naissance_apprenant",
  "date_metier_mise_a_jour_statut",
  "contrat_date_debut",
  "contrat_date_fin",
  "contrat_date_rupture",
  "date_obtention_diplome_formation",
  "date_exclusion_formation",
  "date_rqth_apprenant",
  "date_inscription_formation",
  "date_entree_formation",
  "date_fin_formation",
  "contrat_date_debut_2",
  "contrat_date_fin_2",
  "contrat_date_rupture_2",
  "contrat_date_debut_3",
  "contrat_date_fin_3",
  "contrat_date_rupture_3",
  "contrat_date_debut_4",
  "contrat_date_fin_4",
  "contrat_date_rupture_4",
];

interface TeleversementTableProps {
  data: any[];
  headers: string[];
  columsWithErrors: string[];
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
  columsWithErrors,
  showOnlyColumnsAndLinesWithErrors,
}) => {
  const [paginationState, setPaginationState] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const start = paginationState.pageIndex * paginationState.pageSize;
  const end = start + paginationState.pageSize;

  const paginatedData = data.slice(start, end);

  const filteredHeaders = useMemo(
    () =>
      showOnlyColumnsAndLinesWithErrors && columsWithErrors.length
        ? headers.filter((header) => columsWithErrors.includes(header))
        : headers,
    [headers, columsWithErrors, showOnlyColumnsAndLinesWithErrors]
  );

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
          const value = dateFields.includes(header) ? fromIsoLikeDateStringToFrenchDate(row[header]) : row[header];
          const error = row.errors.find((e: any) => e.key === header);
          return (
            <Box>
              <Box>{value || "Donnée manquante"}</Box>
              {error && <Box color="red.500">{error.message.replace("String", "Texte")}</Box>}
            </Box>
          );
        },
      })),
      {
        accessorKey: "status",
        header: "Statut",
        size: 75,
        cell: (info) => {
          const errors = info.row.original.errors;
          return errors.length === 0 ? (
            <HStack color="green.500">
              <Box>✔ Valide</Box>
            </HStack>
          ) : (
            <HStack color="red.500">
              <Box>
                ⚠ {errors.length} erreur{errors.length > 1 ? "s" : ""}
              </Box>
            </HStack>
          );
        },
      },
    ],
    [filteredHeaders, start]
  );

  const fixedColumns = ["line", "nom_apprenant", "prenom_apprenant"];

  return (
    <>
      <TableWithPagination
        columns={columns}
        data={paginatedData}
        paginationState={paginationState}
        onPageChange={(pageIndex) => setPaginationState((prev) => ({ ...prev, pageIndex }))}
        onLimitChange={(pageSize) => setPaginationState((prev) => ({ ...prev, pageSize, pageIndex: 0 }))}
        pageCount={Math.ceil(data.length / paginationState.pageSize)}
        showPagination={true}
        fixedColumns={fixedColumns}
        rightFixedColumn="status"
      />
    </>
  );
};

export default TeleversementTable;
