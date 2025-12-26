"use client";

import { Table } from "@codegouvfr/react-dsfr/Table";
import type { ITraitementRegionStats, StatsPeriod } from "shared/models/data/nationalStats.model";

import { useSortableTable } from "../hooks/useSortableTable";
import { useTraitementRegionsStats } from "../hooks/useStatsQueries";
import { TableSkeleton } from "../ui/Skeleton";
import { formatMlActives, formatPercentageBadgeSimple } from "../utils";

import { SortableTableHeader } from "./SortableTableHeader";
import styles from "./TraitementTable.module.css";

interface TraitementRegionTableProps {
  period: StatsPeriod;
  national?: boolean;
}

type SortColumn = keyof ITraitementRegionStats;

export function TraitementRegionTable({ period, national = false }: TraitementRegionTableProps) {
  const { sortColumn, sortDirection, handleSort, sortData } = useSortableTable<SortColumn>("traites");
  const { data: regions, isLoading } = useTraitementRegionsStats(period, national);

  const sortedRegions = sortData(regions || []);

  if (isLoading) {
    return <TableSkeleton rows={6} />;
  }

  if (!regions || regions.length === 0) {
    return <p className={styles.emptyMessage}>Aucune donnée disponible.</p>;
  }

  return (
    <div className={styles.tableContainer}>
      <p className={styles.tableDescription}>
        <strong>Sur ce tableau :</strong> Suivez les statistiques de traitement des dossiers à l&apos;échelle des
        régions. Par défaut le tableau classe la présentation des régions par volume de dossiers traités. Vous pouvez
        modifier cet ordre en manipulant les options de tris.
      </p>
      <div className={`${styles.traitementTable} ${styles.regionTable}`}>
        <Table
          headers={[
            <SortableTableHeader
              key="nom"
              column="nom"
              label="Région"
              currentSortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
            />,
            <SortableTableHeader
              key="total_jeunes"
              column="total_jeunes"
              label="Total jeunes"
              currentSortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              centered
            />,
            <SortableTableHeader
              key="a_traiter"
              column="a_traiter"
              label="À traiter"
              currentSortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              centered
            />,
            <SortableTableHeader
              key="traites"
              column="traites"
              label="Traités"
              currentSortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              centered
            />,
            <SortableTableHeader
              key="pourcentage_traites"
              column="pourcentage_traites"
              label="% Traités"
              currentSortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              centered
            />,
            <SortableTableHeader
              key="ml_actives"
              column="ml_actives"
              label="ML actives"
              currentSortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              centered
            />,
          ]}
          data={sortedRegions.map((region) => [
            region.nom,
            <div className={styles.centeredCell} key={`total-${region.code}`}>
              {region.total_jeunes}
            </div>,
            <div className={styles.centeredCell} key={`a-traiter-${region.code}`}>
              {region.a_traiter}
            </div>,
            <div className={styles.centeredCell} key={`traites-${region.code}`}>
              {region.traites > 0 ? region.traites : <span className={styles.emptyValue}>-</span>}
            </div>,
            <div className={styles.centeredCell} key={`pct-${region.code}`}>
              {formatPercentageBadgeSimple(region.pourcentage_traites)}
            </div>,
            <div className={styles.centeredCell} key={`ml-${region.code}`}>
              {formatMlActives(region.ml_actives)}
            </div>,
          ])}
        />
      </div>
    </div>
  );
}
