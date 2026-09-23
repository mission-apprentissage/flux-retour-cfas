"use client";

import type { ICollaborationObjectifs } from "shared/models/data/nationalStats.model";

import { Skeleton } from "@/app/_components/common/Skeleton";

import { MOTIFS_CONFIG } from "./motifsConfig";
import styles from "./ObjectifsBarChart.module.css";

interface ObjectifsBarChartProps {
  data?: ICollaborationObjectifs & { total_dossiers: number };
  loading?: boolean;
}

/**
 * Objectifs d'accompagnement des dossiers de collaboration : un dossier peut cumuler plusieurs
 * objectifs, chaque barre est rapportée au total des dossiers envoyés (fond clair).
 */
export function ObjectifsBarChart({ data, loading }: ObjectifsBarChartProps) {
  if (loading || !data) {
    return <Skeleton height="320px" width="100%" />;
  }

  const total = data.total_dossiers;
  const rows = MOTIFS_CONFIG.map((motif) => {
    const value = data[motif.key] ?? 0;
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return {
      ...motif,
      pct,
      formatted: `${value.toLocaleString("fr-FR")} (${pct}%)`,
    };
  });
  const summary = rows.map((row) => `${row.label} : ${row.formatted}`).join(", ");

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.totalLabel}>Total dossiers envoyés</span>
        <strong>{total.toLocaleString("fr-FR")}</strong>
      </div>
      <ul className={styles.rows} aria-label={`Objectifs d'accompagnement sur ${total} dossiers envoyés : ${summary}`}>
        {rows.map((row) => (
          <li key={row.key} className={styles.row}>
            <span className={styles.label}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="#000091" aria-hidden="true">
                <path d={row.svgPath} />
              </svg>
              {row.label}
            </span>
            <span className={styles.track} aria-hidden="true">
              <span className={styles.bar} style={{ width: `${row.pct}%` }} />
            </span>
            <span className={styles.value}>{row.formatted}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
