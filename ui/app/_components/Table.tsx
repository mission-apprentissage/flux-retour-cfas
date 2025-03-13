"use client";

import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { useState, useEffect, ReactNode, useMemo } from "react";

type CellContent = string | number | ReactNode | JSX.Element;

interface TableProps {
  caption: string;
  data?: CellContent[][];
  headers?: string[];
  itemsPerPage?: number;
  searchTerm?: string;
  searchableColumns?: number[];
  columnWidths?: string[];
}

export function Table({
  caption,
  data = [],
  headers = [],
  itemsPerPage = 1,
  searchTerm = "",
  searchableColumns,
  columnWidths,
}: TableProps) {
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

  const cellMatchesSearch = (cell: CellContent, tokens: string[]): boolean => {
    if (typeof cell !== "string") return false;
    const cellContent = cell.toLowerCase();
    if (tokens.length === 0) return true;
    return tokens.every((token) => cellContent.includes(token));
  };

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

  const noSearchResults = searchTokens.length > 0 && filteredData.length === 0;

  const renderTable = () => {
    return (
      <div className="fr-table fr-table--bordered fr-table--layout-fixed no-borders">
        <table className="fr-table">
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
            {paginatedData.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`cell-${rowIndex}-${cellIndex}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="fr-table-container">
      <div className="fr-mb-2w">
        {filteredData.length > 0 ? (
          renderTable()
        ) : (
          <div className="fr-alert fr-alert--info">
            <p>
              {noSearchResults
                ? `Aucun résultat ne correspond à votre recherche "${searchTerm}".`
                : "Aucune donnée disponible."}
            </p>
          </div>
        )}
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
