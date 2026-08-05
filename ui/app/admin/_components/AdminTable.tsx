"use client";

import { FullTable } from "@/app/_components/table/FullTable";
import { FullTableProps } from "@/app/_components/table/types";

import styles from "./admin-page.module.scss";

export function AdminTable(props: FullTableProps) {
  return (
    <div className={styles.tableWrapper}>
      <FullTable {...props} />
    </div>
  );
}
