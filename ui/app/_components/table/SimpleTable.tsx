"use client";

import { useRouter } from "next/navigation";
import { ReactNode } from "react";

import styles from "./SimpleTable.module.css";

interface ColumnData {
  label?: string;
  dataKey: string;
  width?: number | string;
  numeric?: boolean;
}

interface SimpleTableRowData<R> {
  rawData: R;
  element: Record<string, ReactNode>;
}

interface SimpleTableProps<R> {
  data: SimpleTableRowData<R>[];
  columns: ColumnData[];
  getRowLink?: (rawData: R) => string;
  emptyMessage?: string;
  className?: string;
}

function getGridTemplateColumns(columns: ColumnData[]): string {
  return columns
    .map((col) => {
      if (!col.width) return "1fr";
      return typeof col.width === "number" ? `${col.width}px` : col.width;
    })
    .join(" ");
}

export function SimpleTable<R>({
  data,
  columns,
  getRowLink,
  emptyMessage = "Aucun élément à afficher",
  className,
}: SimpleTableProps<R>) {
  const router = useRouter();

  const handleRowClick = (rawData: R) => {
    if (getRowLink) {
      router.push(getRowLink(rawData));
    }
  };

  const gridTemplateColumns = getGridTemplateColumns(columns);
  const isEmpty = data.length === 0;

  return (
    <div className={className}>
      {isEmpty ? (
        <div className={styles.empty}>{emptyMessage}</div>
      ) : (
        <div className={styles.wrapper}>
          <div className={styles.table} style={{ gridTemplateColumns }}>
            {data.map(({ rawData, element }, rowIndex) => (
              <div
                key={rowIndex}
                className={`${styles.row} ${getRowLink ? styles.clickable : ""}`}
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
      )}
    </div>
  );
}
