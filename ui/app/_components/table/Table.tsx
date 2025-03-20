"use client";

import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { matchSorter } from "match-sorter";
import { useRouter } from "next/navigation";
import { useState, useEffect, ReactNode, useMemo, isValidElement } from "react";

type CellContent = string | number | ReactNode | JSX.Element;

interface TableProps {
  caption: string;
  data?: CellContent[][];
  headers?: string[];
  itemsPerPage?: number;
  searchTerm?: string;
  searchableColumns?: number[];
  columnWidths?: string[];
  getRowLink?: (rowIndex: number) => string;
  className?: string;
  emptyMessage?: string;
}

function extractTextFromReactNode(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) {
    return node.map(extractTextFromReactNode).join(" ");
  }
  if (isValidElement(node) && node.props.children) {
    return extractTextFromReactNode(node.props.children);
  }
  return "";
}

export function Table({
  caption,
  data = [],
  headers = [],
  itemsPerPage = 1,
  searchTerm = "",
  searchableColumns,
  columnWidths,
  getRowLink,
  className,
  emptyMessage = "Aucun élément à afficher",
}: TableProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    const rowsAsObjects = data.map((row, index) => {
      const columnsToSearch =
        searchableColumns && searchableColumns.length > 0
          ? searchableColumns.reduce((acc, colIndex) => {
              if (colIndex >= 0 && colIndex < row.length) {
                acc.push(extractTextFromReactNode(row[colIndex]));
              }
              return acc;
            }, [] as string[])
          : row.map((cell) => extractTextFromReactNode(cell));

      const combinedText = columnsToSearch.join(" ");
      return {
        originalIndex: index,
        row,
        combinedText,
      };
    });

    const matched = matchSorter(rowsAsObjects, searchTerm, { keys: ["combinedText"] });
    return matched.map((obj) => obj.row);
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
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowClick = (rowIndex: number) => {
    if (!getRowLink) return;
    const link = getRowLink(rowIndex);
    router.push(link);
  };

  return (
    <div className={className}>
      <div className="fr-table fr-table--layout-fixed fr-table--bordered no-borders">
        <table id="table-sm">
          <caption style={{ color: "var(--text-title-blue-france)" }}>{caption}</caption>
          {columnWidths && columnWidths.length > 0 && (
            <colgroup>
              {columnWidths.map((width, index) => (
                <col key={`col-${index}`} style={{ width }} />
              ))}
            </colgroup>
          )}
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={`header-${index}`} scope="col">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length || columnWidths?.length || 1}
                  style={{ textAlign: "left", fontStyle: "italic" }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={`row-${rowIndex}`}
                  style={{ cursor: getRowLink ? "pointer" : "auto" }}
                  onClick={() => {
                    if (getRowLink) handleRowClick(rowIndex + (currentPage - 1) * itemsPerPage);
                  }}
                  onMouseEnter={(e) => {
                    if (getRowLink) {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "#f5f5f5";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (getRowLink) {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "";
                    }
                  }}
                >
                  {row.map((cell, cellIndex) => (
                    <td key={`cell-${rowIndex}-${cellIndex}`}>{cell}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredData.length > 0 && (
        <div className="fr-pagination-container">
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
            className="fr-mt-2w"
          />
        </div>
      )}
    </div>
  );
}
