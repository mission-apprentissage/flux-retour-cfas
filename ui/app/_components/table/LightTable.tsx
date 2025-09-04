"use client";

import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { matchSorter } from "match-sorter";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";

import styles from "./LightTable.module.css";

interface ColumnData {
  label: string;
  dataKey: string;
  width?: number | string;
  numeric?: boolean;
}

interface LightTableRowData {
  [key: string]: any;
}

interface LightTableProps {
  caption?: string;
  data: LightTableRowData[];
  columns: ColumnData[];
  itemsPerPage?: number;
  searchTerm?: string;
  searchableColumns?: string[];
  getRowLink?: (rawData: any) => string;
  className?: string;
  emptyMessage?: string;
  withStripes?: boolean;
}

function getGridTemplateColumns(columns: ColumnData[]): string {
  return columns
    .map((col) => {
      if (!col.width) return "1fr";
      return typeof col.width === "number" ? `${col.width}px` : col.width;
    })
    .join(" ");
}

function filterData(data: LightTableRowData[], searchTerm: string, searchableColumns?: string[]) {
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
}

export function LightTable({
  caption = undefined,
  data,
  columns,
  itemsPerPage = 10,
  searchTerm = "",
  searchableColumns,
  getRowLink,
  className,
  emptyMessage = "Aucun élément à afficher",
  withStripes = false,
}: LightTableProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(
    () => filterData(data, searchTerm, searchableColumns),
    [data, searchTerm, searchableColumns]
  );

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredData.length / itemsPerPage)),
    [filteredData, itemsPerPage]
  );

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  useEffect(() => setCurrentPage(1), [searchTerm, data, itemsPerPage]);
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleRowClick = (rawData: LightTableRowData) => {
    if (getRowLink) {
      router.push(getRowLink(rawData));
    }
  };

  const gridTemplateColumns = getGridTemplateColumns(columns);
  const isEmpty = filteredData.length === 0;

  return (
    <div className={className}>
      {caption && <h4 className={`fr-h4 ${styles.caption}`}>{caption}</h4>}

      {isEmpty ? (
        <div className={styles.empty}>{emptyMessage}</div>
      ) : (
        <>
          <div className={styles.wrapper}>
            <div className={styles.table} style={{ gridTemplateColumns }}>
              {paginatedData.map(({ rawData, element }, rowIndex) => (
                <div
                  key={rowIndex}
                  className={`${styles.row} ${
                    withStripes && rowIndex % 2 === 0 ? styles.striped : ""
                  } ${getRowLink ? styles.clickable : ""}`}
                  onClick={() => handleRowClick(rawData)}
                >
                  {columns.map((col) => (
                    <div key={col.dataKey} className={`${styles.cell} ${col.numeric ? styles.numeric : styles.text}`}>
                      {element[col.dataKey]}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {totalPages > 1 && (
            <div className={`fr-pagination-container ${styles.pagination}`}>
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
        </>
      )}
    </div>
  );
}
