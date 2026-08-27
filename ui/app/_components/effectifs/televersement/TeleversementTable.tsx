"use client";

import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { SortingState } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { normalize } from "shared";

import { DataTable } from "@/app/_components/table/DataTable";
import { televersementHeaders } from "@/common/constants/televersementHeaders";
import { formatDateNumericDayMonthYear } from "@/common/utils/dateUtils";

import headerTooltips from "./headerTooltips";
import styles from "./televersement.module.scss";

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

function HeaderLabel({ header }: { header: string }) {
  if (headerTooltips[header]) {
    return (
      <span className={styles.headerWithTooltip}>
        {header}
        <Tooltip kind="click" title={headerTooltips[header]} />
      </span>
    );
  }
  return <>{header}</>;
}

export function TeleversementTable({
  data,
  headers,
  columnsWithErrors,
  showOnlyColumnsAndLinesWithErrors,
}: TeleversementTableProps) {
  const dataWithAdditionalInfo = useMemo(
    () =>
      data.map((row, index) => ({
        lineNumber: index + 2,
        ...row,
        status: row.errors.length === 0 ? "Valide" : `${row.errors.length} erreur${row.errors.length > 1 ? "s" : ""}`,
      })),
    [data]
  );

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sorting, setSorting] = useState<SortingState>([]);

  const filteredData = useMemo(() => {
    return showOnlyColumnsAndLinesWithErrors
      ? dataWithAdditionalInfo.filter((row) => row.errors && row.errors.length > 0)
      : dataWithAdditionalInfo;
  }, [dataWithAdditionalInfo, showOnlyColumnsAndLinesWithErrors]);

  useEffect(() => {
    setPage(1);
  }, [showOnlyColumnsAndLinesWithErrors]);

  const sortedData = useMemo(() => {
    if (sorting.length === 0) return filteredData;
    const { id, desc } = sorting[0];

    return [...filteredData].sort((a, b) => {
      const fieldA = a[id];
      const fieldB = b[id];

      if (fieldA === fieldB) return 0;

      let comparisonResult: number;
      if (fieldA === null || fieldA === undefined) {
        comparisonResult = -1;
      } else if (fieldB === null || fieldB === undefined) {
        comparisonResult = 1;
      } else if (typeof fieldA === "string" && typeof fieldB === "string") {
        comparisonResult = normalize(fieldA).localeCompare(normalize(fieldB));
      } else if (typeof fieldA === "number" && typeof fieldB === "number") {
        comparisonResult = fieldA - fieldB;
      } else {
        comparisonResult = fieldA.toString().localeCompare(fieldB.toString());
      }

      return desc ? -comparisonResult : comparisonResult;
    });
  }, [filteredData, sorting]);

  const lastPage = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const currentPage = Math.min(page, lastPage);
  const pageData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const filteredHeaders = useMemo(() => {
    if (showOnlyColumnsAndLinesWithErrors && columnsWithErrors.length) {
      const fixedColumns = ["nom_apprenant", "prenom_apprenant"];
      return [
        ...fixedColumns,
        ...headers.filter((header) => columnsWithErrors.includes(header) && !fixedColumns.includes(header)),
      ];
    }
    return headers;
  }, [headers, columnsWithErrors, showOnlyColumnsAndLinesWithErrors]);

  const isDateField = (header: string) => televersementHeaders[header]?.type === "date";

  const columns = [
    { label: "Ligne", dataKey: "lineNumber", sortable: false },
    ...filteredHeaders.map((header) => ({
      label: <HeaderLabel header={header} />,
      dataKey: header,
    })),
    { label: <HeaderLabel header="Statut" />, dataKey: "status" },
  ];

  const tableData = pageData.map((row) => {
    const cells: Record<string, React.ReactNode> = {
      lineNumber: row.lineNumber,
      status:
        row.status === "Valide" ? (
          <span className={styles.statusValide}>
            <i className="fr-icon-checkbox-circle-fill fr-icon--sm" aria-hidden="true" /> {row.status}
          </span>
        ) : (
          <span className={styles.statusErreur}>
            <i className="fr-icon-warning-fill fr-icon--sm" aria-hidden="true" /> {row.status}
          </span>
        ),
    };
    const rawData: Record<string, unknown> = { lineNumber: row.lineNumber, status: row.status };

    for (const header of filteredHeaders) {
      let value = row[header];
      if (televersementHeaders[header]?.type === "boolean") {
        value = value === true ? "Oui" : value === false ? "Non" : "";
      } else if (isDateField(header)) {
        value = fromIsoLikeDateStringToFrenchDate(value);
      }
      const error = row.errors.find((e: any) => e.key === header);
      rawData[header] = row[header];
      cells[header] = (
        <span>
          <span>{value}</span>
          {error && <span className={styles.cellError}> {error.message.replace("String", "Texte")}</span>}
        </span>
      );
    }

    return { rawData, element: cells };
  });

  const errorCount = dataWithAdditionalInfo.filter((row) => row.errors && row.errors.length > 0).length;
  const lineCount = data.length;

  return (
    <>
      <p className={styles.lineCount}>
        Votre fichier inclut{" "}
        <strong>
          {lineCount || "N/A"} {`ligne${lineCount > 1 ? "s" : ""}`}
        </strong>
        {errorCount > 0 && `, dont ${`${errorCount} ${errorCount === 1 ? "est" : "sont"} en erreur`}`}
      </p>
      <div className={styles.televersementTable}>
        <DataTable
          data={tableData}
          columns={columns as any}
          tableLabel="Contenu du fichier téléversé"
          sorting={sorting}
          onSortingChange={setSorting}
          pagination={{ total: sortedData.length, page: currentPage, limit: pageSize, lastPage }}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSize={pageSize}
          emptyMessage="Aucune ligne à afficher"
        />
      </div>
    </>
  );
}
