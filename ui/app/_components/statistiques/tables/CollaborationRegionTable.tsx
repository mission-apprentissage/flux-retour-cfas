"use client";

import { Table } from "@codegouvfr/react-dsfr/Table";
import { useMemo } from "react";

import { useSortableTable } from "../hooks/useSortableTable";
import { TableSkeleton } from "../ui/Skeleton";
import { formatDelta } from "../utils";

import styles from "./CollaborationRegionTable.module.css";
import { SortableTableHeader } from "./SortableTableHeader";

export interface CollaborationRegionRow {
  region_code: string;
  region_nom: string;
  cfa_compatibles: number;
  cfa_actives: { current: number; delta: number };
  dossiers_envoyes_cfa: number;
}

interface CollaborationRegionTableProps {
  regions: CollaborationRegionRow[] | undefined;
  loading: boolean;
}

type SortColumn = "region_nom" | "cfa_compatibles" | "cfa_actives" | "dossiers_envoyes_cfa";

export function CollaborationRegionTable({ regions, loading }: CollaborationRegionTableProps) {
  const { sortColumn, sortDirection, handleSort } = useSortableTable<SortColumn>("cfa_compatibles");

  const sorted = useMemo(() => {
    if (!regions) return [];
    const get = (r: CollaborationRegionRow): number | string => {
      switch (sortColumn) {
        case "region_nom":
          return r.region_nom;
        case "cfa_compatibles":
          return r.cfa_compatibles;
        case "cfa_actives":
          return r.cfa_actives.current;
        case "dossiers_envoyes_cfa":
          return r.dossiers_envoyes_cfa;
      }
    };
    return [...regions].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      const cmp =
        typeof va === "string" && typeof vb === "string" ? va.localeCompare(vb, "fr") : Number(va) - Number(vb);
      return sortDirection === "desc" ? -cmp : cmp;
    });
  }, [regions, sortColumn, sortDirection]);

  if (loading) {
    return <TableSkeleton rows={8} />;
  }

  if (!regions || regions.length === 0) {
    return <p className={styles.emptyMessage}>Aucune région à afficher.</p>;
  }

  return (
    <div className={styles.table}>
      <Table
        headers={[
          <SortableTableHeader
            key="region"
            column="region_nom"
            label="Région"
            currentSortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
          />,
          <SortableTableHeader
            key="compat"
            column="cfa_compatibles"
            label="CFA V2 compatibles"
            currentSortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
            centered
          />,
          <SortableTableHeader
            key="actives"
            column="cfa_actives"
            label="CFA activés sur la V2"
            currentSortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
            centered
          />,
          <SortableTableHeader
            key="dossiers"
            column="dossiers_envoyes_cfa"
            label="Total collab demandées"
            currentSortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
            centered
          />,
        ]}
        data={sorted.map((r) => [
          r.region_nom,
          <div className={styles.centeredCell} key={`compat-${r.region_code}`}>
            {r.cfa_compatibles}
          </div>,
          <div className={styles.centeredCell} key={`actives-${r.region_code}`}>
            <span>
              <strong>{r.cfa_actives.current}</strong>/{r.cfa_compatibles}
            </span>
            {formatDelta(r.cfa_actives.delta)}
          </div>,
          <div className={styles.centeredCell} key={`dossiers-${r.region_code}`}>
            {r.dossiers_envoyes_cfa}
          </div>,
        ])}
      />
    </div>
  );
}
