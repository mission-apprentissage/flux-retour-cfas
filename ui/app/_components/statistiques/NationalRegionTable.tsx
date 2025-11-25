"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { useState } from "react";

import styles from "./NationalRegionTable.module.css";

export interface NationalRegionStats {
  code: string;
  nom: string;
  deployed: boolean;
  ml_total: number;
  ml_activees: number;
  ml_activees_delta: number;
  ml_engagees: number;
  ml_engagees_delta: number;
  engagement_rate: number;
  a_traiter?: number;
  traites?: number;
  traites_variation?: string;
}

interface NationalRegionTableProps {
  regions: NationalRegionStats[];
}

export function NationalRegionTable({ regions }: NationalRegionTableProps) {
  const [showAll, setShowAll] = useState(false);
  const [sortColumn, setSortColumn] = useState<keyof NationalRegionStats>("ml_activees");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const sortedRegions = [...regions].sort((a, b) => {
    const aVal = a[sortColumn] ?? 0;
    const bVal = b[sortColumn] ?? 0;

    const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    const primarySort = sortDirection === "desc" ? -comparison : comparison;

    if (primarySort !== 0) return primarySort;

    if (a.ml_activees !== b.ml_activees) return b.ml_activees - a.ml_activees;

    return b.ml_engagees - a.ml_engagees;
  });

  const displayedRegions = showAll ? sortedRegions : sortedRegions.slice(0, 6);

  const hasMoreThan6Regions = sortedRegions.length > 6;

  const handleSort = (column: keyof NationalRegionStats) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const formatNumericIndicator = (value: number | string, type: "delta" | "variation") => {
    const numValue = typeof value === "string" ? parseInt(value.replace(/[+%]/g, "")) : value;
    const displayValue = type === "delta" && typeof value === "number" && value > 0 ? `+${value}` : value;

    const stylePrefix = type === "delta" ? "delta" : "variation";
    const specialZeroDisplay = type === "delta" && numValue === 0 ? "=" : displayValue;

    if (numValue === 0) return <span className={styles[`${stylePrefix}Zero`]}>{specialZeroDisplay}</span>;
    if (numValue > 0) return <span className={styles[`${stylePrefix}Positive`]}>{displayValue}</span>;
    return <span className={styles[`${stylePrefix}Negative`]}>{displayValue}</span>;
  };

  const formatDelta = (delta: number) => formatNumericIndicator(delta, "delta");
  const formatVariationBadge = (variation: string) => formatNumericIndicator(variation, "variation");

  const SortableHeader = ({
    column,
    label,
    centered,
    tooltip,
  }: {
    column: keyof NationalRegionStats;
    label: string;
    centered?: boolean;
    tooltip?: string;
  }) => {
    const isSorted = sortColumn === column;
    const iconClass = sortDirection === "desc" ? "ri-arrow-down-line" : "ri-arrow-up-line";

    const content = (
      <div onClick={() => handleSort(column)} className={styles.sortableContent}>
        {label}
        {isSorted && <i className={`${iconClass} ${styles.sortIcon}`} />}
      </div>
    );

    return (
      <div className={centered ? styles.sortableHeaderCentered : styles.sortableHeader}>
        {content}
        {tooltip && <Tooltip kind="hover" title={tooltip} />}
      </div>
    );
  };

  return (
    <div>
      {displayedRegions.length === 0 ? (
        <p className={styles.emptyMessage}>Aucune région à afficher.</p>
      ) : (
        <div className={styles.regionStatsTable}>
          <Table
            headers={[
              "Région",
              <SortableHeader key="ml_activees" column="ml_activees" label="ML actives" centered={true} />,
              <SortableHeader
                key="ml_engagees"
                column="ml_engagees"
                label="ML engagées"
                centered={true}
                tooltip="Les Missions Locales sont considérées comme engagées sur l'utilisation du service du Tableau de bord de l'apprentissage à partir d'un taux de dossiers traités supérieur à 70%."
              />,
              <SortableHeader key="a_traiter" column="a_traiter" label="À traiter" centered={true} />,
              <SortableHeader key="traites" column="traites" label="Traités" centered={true} />,
            ]}
            data={displayedRegions.map((region) => {
              const hasActiveML = region.ml_activees > 0;

              return [
                region.nom,
                <div className={styles.centeredCell} key={`active-${region.code}`}>
                  <span>
                    <strong>{region.ml_activees}</strong>/{region.ml_total}
                  </span>
                  {formatDelta(region.ml_activees_delta)}
                </div>,
                <div className={styles.centeredCell} key={`engaged-${region.code}`}>
                  {hasActiveML ? (
                    <>
                      <span>
                        <strong>{region.ml_engagees}</strong>/{region.ml_activees}
                      </span>
                      {formatDelta(region.ml_engagees_delta)}
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
                      {region.traites_variation && formatVariationBadge(region.traites_variation)}
                    </>
                  ) : (
                    <span>-</span>
                  )}
                </div>,
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
