"use client";

import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { Table as MuiTable, TableBody, TableCell, TableContainer, TableRow, Paper, Typography } from "@mui/material";
import { matchSorter } from "match-sorter";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";

interface ColumnData {
  label: string;
  dataKey: string;
  width?: number | string;
  numeric?: boolean;
  searchable?: boolean;
}

interface LightTableRowData {
  [key: string]: any;
}

interface LightTableProps {
  caption: string;
  data: LightTableRowData[];
  columns: ColumnData[];
  itemsPerPage?: number;
  searchTerm?: string;
  searchableColumns?: string[];
  columnWidths?: string[];
  getRowLink?: (rawData: any) => string;
  className?: string;
  emptyMessage?: string;
}

export function LightTable({
  caption,
  data,
  columns,
  itemsPerPage = 10,
  searchTerm = "",
  searchableColumns,
  getRowLink,
  className,
  emptyMessage = "Aucun élément à afficher",
}: LightTableProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    const terms = searchTerm.split(" ");

    return terms.reduce(
      (results, term) =>
        matchSorter(results, term, {
          threshold: matchSorter.rankings.CONTAINS,
          keys: searchableColumns?.map((column) => `rawData.${column}`),
        }),
      data
    );
  }, [data, searchTerm, searchableColumns]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  }, [filteredData, itemsPerPage]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, data, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowClick = (rowData: LightTableRowData) => {
    if (!getRowLink) return;
    const link = getRowLink(rowData);
    router.push(link);
  };

  const isEmpty = filteredData.length === 0;

  return (
    <div className={className}>
      <Typography
        variant="h4"
        sx={{
          mt: 3,
          mb: 2,
          color: "var(--text-title-blue-france)",
          textAlign: "left",
        }}
      >
        {caption}
      </Typography>
      {isEmpty ? (
        <div style={{ fontStyle: "italic" }}>{emptyMessage}</div>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ boxShadow: "none", overflowX: "auto" }}>
          <MuiTable sx={{ width: "100%", minWidth: 600 }}>
            <TableBody>
              {paginatedData.map(({ rawData, element }, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  hover={!!getRowLink}
                  sx={{ cursor: getRowLink ? "pointer" : "auto" }}
                  onClick={() => handleRowClick(rawData)}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.dataKey}
                      align={col.numeric ? "right" : "left"}
                      sx={{ width: col.width, borderBottom: "1px solid var(--border-default-grey)" }}
                    >
                      {element[col.dataKey]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </MuiTable>
        </TableContainer>
      )}
      {!isEmpty && totalPages > 1 && (
        <div className="fr-pagination-container" style={{ marginTop: "1rem" }}>
          <Pagination
            count={totalPages}
            defaultPage={currentPage}
            getPageLinkProps={(pageNumber) => ({
              href: `#page-${pageNumber}`,
              onClick: (e) => {
                e.preventDefault();
                handlePageChange(pageNumber);
              },
            })}
            showFirstLast
          />
        </div>
      )}
    </div>
  );
}
