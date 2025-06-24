"use client";

import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import {
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Typography,
  Box,
} from "@mui/material";
import { visuallyHidden } from "@mui/utils";
import { matchSorter } from "match-sorter";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";

interface ColumnData {
  label: string;
  dataKey: string;
  width?: number | string;
  numeric?: boolean;
  searchable?: boolean;
  sortable?: boolean;
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
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [orderBy, setOrderBy] = useState<string>("");

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

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

  const sortedData = useMemo(() => {
    if (!orderBy) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a.rawData[orderBy];
      const bValue = b.rawData[orderBy];

      if (aValue == null) return order === "asc" ? -1 : 1;
      if (bValue == null) return order === "asc" ? 1 : -1;

      if (typeof aValue === "number" && typeof bValue === "number") {
        return order === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();
      return order === "asc" ? aString.localeCompare(bString) : bString.localeCompare(aString);
    });
  }, [filteredData, orderBy, order]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(sortedData.length / itemsPerPage));
  }, [sortedData, itemsPerPage]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, data, itemsPerPage, orderBy, order]);

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
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.dataKey}
                    align={column.numeric ? "right" : "left"}
                    sortDirection={orderBy === column.dataKey ? order : false}
                    sx={{
                      width: column.width,
                      fontWeight: "bold",
                      borderBottomColor: "var(--blue-france-sun-113)",
                      borderBottomStyle: "solid",
                      borderBottomWidth: "3px",
                      padding: "12px",
                      paddingTop: "8px",
                      color: "var(--text-action-high-blue-france)",
                      "&:hover": {
                        backgroundColor: "#F8F8F8",
                      },
                    }}
                  >
                    {column.sortable !== false ? (
                      <TableSortLabel
                        active={orderBy === column.dataKey}
                        direction={orderBy === column.dataKey ? order : "asc"}
                        onClick={() => handleRequestSort(column.dataKey)}
                      >
                        {column.label}
                        {orderBy === column.dataKey ? (
                          <Box component="span" sx={visuallyHidden}>
                            {order === "desc" ? "trié par ordre décroissant" : "trié par ordre croissant"}
                          </Box>
                        ) : null}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
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
