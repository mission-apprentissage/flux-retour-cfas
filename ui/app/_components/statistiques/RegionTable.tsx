"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { useState } from "react";

import styles from "./RegionTable.module.css";

export interface RegionStats {
  code: string;
  nom: string;
  deployed: boolean;
  ml_total: number;
  ml_activees: number;
  ml_activees_delta: number;
  ml_engagees: number;
  ml_engagees_delta: number;
  engagement_rate: number;
}

interface RegionTableProps {
  regions: RegionStats[];
  showDetailColumn?: boolean;
}

export function RegionTable({ regions, showDetailColumn = true }: RegionTableProps) {
  const [showInactive, setShowInactive] = useState(false);
  const [sortColumn, setSortColumn] = useState<keyof RegionStats>("ml_total");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const filteredRegions = showInactive ? regions : regions.filter((r) => r.deployed);

  const displayedRegions = [...filteredRegions].sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];

    const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    const primarySort = sortDirection === "desc" ? -comparison : comparison;

    if (primarySort !== 0) return primarySort;

    if (a.ml_total !== b.ml_total) return b.ml_total - a.ml_total;

    if (a.ml_activees !== b.ml_activees) return b.ml_activees - a.ml_activees;

    return b.ml_engagees - a.ml_engagees;
  });

  const hasInactiveRegions = regions.some((r) => !r.deployed);

  const handleSort = (column: keyof RegionStats) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const formatDelta = (delta: number) => {
    if (delta === 0) return <span className={styles.deltaZero}>=</span>;
    if (delta > 0) return <span className={styles.deltaPositive}>+{delta}</span>;
    return <span className={styles.deltaNegative}>{delta}</span>;
  };

  const formatEngagementBadge = (rate: number) => {
    const percentage = Math.round(rate * 100);
    const isHighEngagement = rate >= 0.5;

    return (
      <span className={isHighEngagement ? styles.engagementBadgeHigh : styles.engagementBadgeLow}>{percentage}%</span>
    );
  };

  const SortableHeader = ({
    column,
    label,
    centered,
  }: {
    column: keyof RegionStats;
    label: string;
    centered?: boolean;
  }) => {
    const isSorted = sortColumn === column;
    const iconClass = sortDirection === "desc" ? "ri-arrow-down-line" : "ri-arrow-up-line";

    return (
      <div
        onClick={() => handleSort(column)}
        className={centered ? styles.sortableHeaderCentered : styles.sortableHeader}
      >
        {label}
        {isSorted && <i className={`${iconClass} ${styles.sortIcon}`} />}
      </div>
    );
  };

  return (
    <div>
      {displayedRegions.length === 0 ? (
        <p className={styles.emptyMessage}>
          Aucune région à afficher.{" "}
          {!showInactive && hasInactiveRegions && "Cliquez sur le bouton ci-dessous pour afficher toutes les régions."}
        </p>
      ) : (
        <div className={styles.regionStatsTable}>
          <Table
            headers={[
              "Région",
              <SortableHeader key="ml_total" column="ml_total" label="Total ML" centered={true} />,
              <SortableHeader key="ml_activees" column="ml_activees" label="ML actives" centered={true} />,
              <div key="ml_engagees" className={styles.sortableHeaderCentered}>
                <div onClick={() => handleSort("ml_engagees")} className={styles.sortableContent}>
                  ML engagées
                  {sortColumn === "ml_engagees" && (
                    <i
                      className={`${sortDirection === "desc" ? "ri-arrow-down-line" : "ri-arrow-up-line"} ${styles.sortIcon}`}
                    />
                  )}
                </div>
                <Tooltip
                  kind="hover"
                  title="Les Missions Locales sont considérées comme engagées sur l'utilisation du service du Tableau de bord de l'apprentissage à partir d'un taux de dossiers traités supérieur à 70%."
                />
              </div>,
              ...(showDetailColumn ? ["Détail"] : []),
            ]}
            data={displayedRegions.map((region) => [
              region.nom,
              region.ml_total.toString(),
              <div className={styles.centeredCell} key={`active-${region.code}`}>
                <span>
                  <strong>{region.ml_activees}</strong>/{region.ml_total}
                </span>
                {formatDelta(region.ml_activees_delta)}
              </div>,
              <div className={styles.centeredCell} key={`engaged-${region.code}`}>
                <span>
                  <strong>{region.ml_engagees}</strong>/{region.ml_activees}
                </span>
                {formatDelta(region.ml_engagees_delta)}
                {formatEngagementBadge(region.engagement_rate)}
              </div>,
              ...(showDetailColumn ? [""] : []),
            ])}
          />
        </div>
      )}

      {hasInactiveRegions && (
        <div className={styles.buttonContainer}>
          <Button priority="secondary" size="small" onClick={() => setShowInactive(!showInactive)}>
            {showInactive ? "Masquer les régions inactives" : "Afficher les régions inactives"}
          </Button>
        </div>
      )}
    </div>
  );
}
