"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { useState } from "react";

import { TableSkeleton } from "@/app/_components/common/Skeleton";

import type { useStatsXlsxExport } from "../hooks/useStatsXlsxExport";
import tableStyles from "../tables/CfaEtablissementsTable.module.css";
import { StatsTablePagination } from "../tables/StatsTablePagination";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import styles from "./CfaAlertesSection.module.css";

interface AlerteCardProps {
  title: React.ReactNode;
  query: { data?: { total: number; pagination: { total_pages: number } }; isLoading: boolean; error: unknown };
  loadingRows: boolean;
  exporter: ReturnType<typeof useStatsXlsxExport>;
  headers: React.ReactNode[];
  rows: React.ReactNode[][];
  page: number;
  onPageChange: (page: number) => void;
  limit: number;
  onLimitChange: (limit: number) => void;
}

/** Alerte repliable : compteur, export et tableau paginé, affiché au clic sur « Voir ». */
export function AlerteCard({
  title,
  query,
  loadingRows,
  exporter,
  headers,
  rows,
  page,
  onPageChange,
  limit,
  onLimitChange,
}: AlerteCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { data, isLoading, error } = query;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h4 className={styles.alertTitle}>
          <span className={`fr-icon-information-line ${styles.alertIcon}`} aria-hidden="true" />
          <span>{title}</span>
        </h4>
        <div className={styles.actions}>
          {data && <span className={styles.count}>{data.total.toLocaleString("fr-FR")} CFA</span>}
          <Button
            iconId="fr-icon-download-line"
            iconPosition="right"
            priority="secondary"
            onClick={exporter.exportData}
            disabled={exporter.isExporting || !data?.total}
          >
            {exporter.isExporting ? "Export en cours..." : "Exporter les données"}
          </Button>
          <Button
            iconId={expanded ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line"}
            iconPosition="right"
            priority="secondary"
            onClick={() => setExpanded((value) => !value)}
            disabled={!data?.total}
            nativeButtonProps={{ "aria-expanded": expanded }}
          >
            {expanded ? "Masquer" : "Voir"}
          </Button>
        </div>
      </div>
      {exporter.error && (
        <Alert
          severity="error"
          title="Erreur"
          description={exporter.error}
          closable
          onClose={exporter.clearError}
          small
        />
      )}
      {expanded && (
        <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
          {loadingRows ? (
            <TableSkeleton rows={Math.min(limit, rows.length || limit)} />
          ) : (
            <div className={tableStyles.tableContainer}>
              <div className={tableStyles.table}>
                <Table headers={headers} data={rows} />
              </div>
              {data && (
                <StatsTablePagination
                  page={page}
                  totalPages={data.pagination.total_pages}
                  onPageChange={onPageChange}
                  limit={limit}
                  onLimitChange={onLimitChange}
                  label="CFA en alerte"
                />
              )}
            </div>
          )}
        </StatsErrorHandler>
      )}
    </div>
  );
}
