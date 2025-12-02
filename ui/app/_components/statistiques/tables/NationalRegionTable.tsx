"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Table } from "@codegouvfr/react-dsfr/Table";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { IRegionStats } from "shared/models/data/nationalStats.model";

import { useSortableTable } from "../hooks/useSortableTable";
import { Skeleton } from "../ui/Skeleton";
import { formatDelta, formatVariationBadge } from "../utils";

import styles from "./NationalRegionTable.module.css";
import { SortableTableHeader } from "./SortableTableHeader";

interface NationalRegionTableProps {
  regions: IRegionStats[];
  loadingDeltas?: boolean;
  isAdmin?: boolean;
}

type SortColumn = keyof IRegionStats;

export function NationalRegionTable({ regions, loadingDeltas = false, isAdmin = false }: NationalRegionTableProps) {
  const [showAll, setShowAll] = useState(false);
  const { sortColumn, sortDirection, handleSort } = useSortableTable<SortColumn>("ml_activees");

  const sortedRegions = useMemo(() => {
    const columnsWithEmptyHandling: SortColumn[] = ["ml_engagees", "a_traiter", "traites"];

    return [...regions].sort((a, b) => {
      if (columnsWithEmptyHandling.includes(sortColumn)) {
        const aHasActiveML = a.ml_activees > 0;
        const bHasActiveML = b.ml_activees > 0;

        if (!aHasActiveML && !bHasActiveML) {
          if (a.ml_activees !== b.ml_activees) return b.ml_activees - a.ml_activees;
          return b.ml_engagees - a.ml_engagees;
        }
        if (!aHasActiveML) return sortDirection === "asc" ? -1 : 1;
        if (!bHasActiveML) return sortDirection === "asc" ? 1 : -1;
      }

      const aVal = a[sortColumn] ?? 0;
      const bVal = b[sortColumn] ?? 0;

      const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      const primarySort = sortDirection === "desc" ? -comparison : comparison;

      if (primarySort !== 0) return primarySort;

      if (a.ml_activees !== b.ml_activees) return b.ml_activees - a.ml_activees;

      return b.ml_engagees - a.ml_engagees;
    });
  }, [regions, sortColumn, sortDirection]);

  const displayedRegions = showAll ? sortedRegions : sortedRegions.slice(0, 6);
  const hasMoreThan6Regions = sortedRegions.length > 6;

  return (
    <div>
      {displayedRegions.length === 0 ? (
        <p className={styles.emptyMessage}>Aucune région à afficher.</p>
      ) : (
        <div className={styles.regionStatsTable}>
          <Table
            headers={[
              "Région",
              <SortableTableHeader
                key="ml_activees"
                column="ml_activees"
                label="ML actives"
                currentSortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
                centered
              />,
              <SortableTableHeader
                key="ml_engagees"
                column="ml_engagees"
                label="ML engagées"
                currentSortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
                centered
                tooltip="Les Missions Locales sont considérées comme engagées sur l'utilisation du service du Tableau de bord de l'apprentissage à partir d'un taux de dossiers traités supérieur à 70%."
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
              ...(isAdmin ? ["Détail"] : []),
            ]}
            data={displayedRegions.map((region) => {
              const hasActiveML = region.ml_activees > 0;

              return [
                region.nom,
                <div className={styles.centeredCell} key={`active-${region.code}`}>
                  <span>
                    <strong>{region.ml_activees}</strong>/{region.ml_total}
                  </span>
                  {loadingDeltas ? <Skeleton width="24px" height="16px" /> : formatDelta(region.ml_activees_delta)}
                </div>,
                <div className={styles.centeredCell} key={`engaged-${region.code}`}>
                  {hasActiveML ? (
                    <>
                      <span>
                        <strong>{region.ml_engagees}</strong>/{region.ml_activees}
                      </span>
                      {loadingDeltas ? <Skeleton width="24px" height="16px" /> : formatDelta(region.ml_engagees_delta)}
                    </>
                  ) : (
                    <span>-</span>
                  )}
                </div>,
                <div className={styles.centeredCell} key={`a-traiter-${region.code}`}>
                  {hasActiveML ? region.a_traiter || 0 : <span>-</span>}
                </div>,
                <div className={styles.centeredCell} key={`traites-${region.code}`}>
                  {hasActiveML ? (
                    <>
                      <span>{region.traites || 0}</span>
                      {loadingDeltas ? (
                        <Skeleton width="40px" height="16px" />
                      ) : (
                        region.traites_variation && formatVariationBadge(region.traites_variation)
                      )}
                    </>
                  ) : (
                    <span>-</span>
                  )}
                </div>,
                ...(isAdmin
                  ? [
                      <Link
                        key={`detail-${region.code}`}
                        href={`/admin/suivi-des-indicateurs/region/${region.code}`}
                        className={`${styles.detailLink} ${styles.stretchedLink}`}
                      >
                        <span className={`fr-icon-arrow-right-line ${styles.detailArrow}`} aria-hidden="true" />
                      </Link>,
                    ]
                  : []),
              ];
            })}
          />
        </div>
      )}

      {hasMoreThan6Regions && (
        <div className={styles.buttonContainer}>
          <Button priority="secondary" size="small" onClick={() => setShowAll(!showAll)}>
            {showAll ? "Afficher moins de régions" : "Afficher toutes les régions"}
          </Button>
        </div>
      )}
    </div>
  );
}
