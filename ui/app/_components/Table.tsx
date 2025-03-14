"use client";

import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
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
  if (Array.isArray(node)) return node.map(extractTextFromReactNode).join(" ");
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

  const searchTokens = useMemo(() => {
    if (!searchTerm) return [];
    const tokens: string[] = [];
    let currentPhrase = "";
    let inQuotes = false;
    for (let i = 0; i < searchTerm.length; i++) {
      const char = searchTerm[i];
      if (char === '"') {
        inQuotes = !inQuotes;
        if (!inQuotes && currentPhrase.trim()) {
          tokens.push(currentPhrase.trim().toLowerCase());
          currentPhrase = "";
        }
      } else if (char === " " && !inQuotes) {
        if (currentPhrase.trim()) {
          tokens.push(currentPhrase.trim().toLowerCase());
          currentPhrase = "";
        }
      } else {
        currentPhrase += char;
      }
    }
    if (currentPhrase.trim()) {
      tokens.push(currentPhrase.trim().toLowerCase());
    }
    return tokens.filter((token) => token.length > 0);
  }, [searchTerm]);

  function cellMatchesSearch(cell: CellContent, tokens: string[]): boolean {
    const content = extractTextFromReactNode(cell).toLowerCase();
    if (tokens.length === 0) return true;
    return tokens.every((token) => content.includes(token));
  }

  const filteredData = useMemo(() => {
    if (searchTokens.length === 0) return data;
    return data.filter((row) => {
      if (searchableColumns && searchableColumns.length > 0) {
        return searchableColumns.some((colIndex) => {
          if (colIndex < 0 || colIndex >= row.length) return false;
          return cellMatchesSearch(row[colIndex], searchTokens);
        });
      }
      return row.some((cell) => cellMatchesSearch(cell, searchTokens));
    });
  }, [data, searchTokens, searchableColumns]);

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
          <caption>{caption}</caption>
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
                    if (getRowLink) handleRowClick(rowIndex);
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
