"use client";

import { Table } from "@codegouvfr/react-dsfr/Table";
import { useMemo } from "react";

import { TableSkeleton } from "@/app/_components/common/Skeleton";

import { useSortableTable } from "../hooks/useSortableTable";
import { formatDelta } from "../utils";

import styles from "./CollaborationRegionTable.module.css";
import { SortableTableHeader } from "./SortableTableHeader";

export interface CollaborationRegionRow {
  region_code: string;
  region_nom: string;
  cfa_compatibles: number;
  cfa_avec_compte: number;
  cfa_with_collab: { current: number; delta?: number };
  dossiers_envoyes_cfa: number;
}

interface CollaborationRegionTableProps {
  regions: CollaborationRegionRow[] | undefined;
  loading: boolean;
}

type SortColumn = "region_nom" | "cfa_compatibles" | "cfa_avec_compte" | "cfa_with_collab" | "dossiers_envoyes_cfa";

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
        case "cfa_avec_compte":
          return r.cfa_avec_compte;
        case "cfa_with_collab":
          return r.cfa_with_collab.current;
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
            label="CFA compatibles"
            currentSortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
            centered
          />,
          <SortableTableHeader
            key="compte"
            column="cfa_avec_compte"
            label="CFA avec compte TBA"
            currentSortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
            centered
          />,
          <SortableTableHeader
            key="collab"
            column="cfa_with_collab"
            label="CFA qui collaborent"
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
          <div className={styles.centeredCell} key={`compte-${r.region_code}`}>
            <span>
              <strong>{r.cfa_avec_compte}</strong>/{r.cfa_compatibles}
            </span>
          </div>,
          <div className={styles.centeredCell} key={`collab-${r.region_code}`}>
            <span>
              <strong>{r.cfa_with_collab.current}</strong>/{r.cfa_compatibles}
            </span>
            {r.cfa_with_collab.delta !== undefined && formatDelta(r.cfa_with_collab.delta)}
          </div>,
          <div className={styles.centeredCell} key={`dossiers-${r.region_code}`}>
            {r.dossiers_envoyes_cfa}
          </div>,
        ])}
      />
    </div>
  );
}
