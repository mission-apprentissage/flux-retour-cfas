"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { useEffect, useState } from "react";
import type { ICfaInvitesSortBy } from "shared/models/routes/admin/cfa-invites-sans-collab.api";

import { TableSkeleton } from "@/app/_components/common/Skeleton";

import { useCfaInvitesExport } from "../hooks/useCfaInvitesExport";
import { useSortableTable } from "../hooks/useSortableTable";
import { useStatsFilters } from "../hooks/useStatsFilters";
import { useCfaInvitesSansCollabStats } from "../hooks/useStatsQueries";
import { Localisation } from "../tables/CfaEtablissementsTable";
import tableStyles from "../tables/CfaEtablissementsTable.module.css";
import { SortableTableHeader } from "../tables/SortableTableHeader";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import styles from "./CfaAlertesSection.module.css";

const PAGE_SIZES = [10, 20, 50];

const COLUMNS: Array<{ column: ICfaInvitesSortBy; label: string; centered?: boolean }> = [
  { column: "nom", label: "Raison sociale" },
  { column: "compte", label: "Compte TBA", centered: true },
  { column: "localisation", label: "Localisation" },
  { column: "invitations", label: "Invitations reçues", centered: true },
];

export function CfaAlertesSection() {
  const { region } = useStatsFilters();
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { sortColumn, sortDirection, handleSort } = useSortableTable<ICfaInvitesSortBy>("invitations", "desc", {
    onSortChange: () => setPage(1),
    columnDefaultDirections: { nom: "asc", localisation: "asc" },
  });
  const params = { region, sort_by: sortColumn, sort_order: sortDirection };

  useEffect(() => setPage(1), [region]);

  const { data, isLoading, isFetching, isPlaceholderData, error } = useCfaInvitesSansCollabStats({
    ...params,
    page,
    limit,
  });
  const { exportData, isExporting, error: exportError, clearError } = useCfaInvitesExport(params);
  const rows = data?.data ?? [];

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>
        <span className={`fr-icon-error-warning-line ${styles.sectionIcon}`} aria-hidden="true" />
        Les alertes à surveiller
      </h3>
      <div className={styles.card}>
        <div className={styles.header}>
          <h4 className={styles.alertTitle}>
            <span className={`fr-icon-information-line ${styles.alertIcon}`} aria-hidden="true" />
            <span>
              Les CFA ont reçu des invitations des Missions Locales mais n&apos;ont{" "}
              <span className={styles.highlight}>pas encore fait de collaborations</span>
            </span>
          </h4>
          <div className={styles.actions}>
            {data && <span className={styles.count}>{data.total.toLocaleString("fr-FR")} CFA</span>}
            <Button
              iconId="fr-icon-download-line"
              iconPosition="right"
              priority="secondary"
              onClick={exportData}
              disabled={isExporting || !data?.total}
            >
              {isExporting ? "Export en cours..." : "Exporter les données"}
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
        {exportError && (
          <Alert severity="error" title="Erreur" description={exportError} closable onClose={clearError} small />
        )}
        {expanded && (
          <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
            {isLoading || (isFetching && isPlaceholderData) ? (
              <TableSkeleton rows={Math.min(limit, rows.length || limit)} />
            ) : (
              <div className={tableStyles.tableContainer}>
                <div className={tableStyles.table}>
                  <Table
                    headers={COLUMNS.map(({ column, label, centered }) => (
                      <SortableTableHeader
                        key={column}
                        column={column}
                        label={label}
                        currentSortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        centered={centered}
                      />
                    ))}
                    data={rows.map((row) => [
                      <div key={`nom-${row.organisme_id}`} className={tableStyles.nameCell}>
                        <span className={tableStyles.name}>{row.raison_sociale ?? "Raison sociale inconnue"}</span>
                        <span className={tableStyles.meta}>
                          UAI : {row.uai ?? "—"} · SIRET : {row.siret}
                        </span>
                      </div>,
                      <div key={`compte-${row.organisme_id}`} className={tableStyles.centeredCell}>
                        <Badge as="span" noIcon small severity={row.has_account ? "success" : "error"}>
                          {row.has_account ? "Oui" : "Non"}
                        </Badge>
                      </div>,
                      <Localisation key={`loc-${row.organisme_id}`} adresse={row.adresse} />,
                      <div key={`inv-${row.organisme_id}`} className={tableStyles.centeredCell}>
                        {row.invitations_recues}
                      </div>,
                    ])}
                  />
                </div>
                {data && data.total > PAGE_SIZES[0] && (
                  <div className={tableStyles.paginationContainer}>
                    <Pagination
                      key={page}
                      count={data.pagination.total_pages}
                      defaultPage={page}
                      getPageLinkProps={(pageNumber) => ({
                        href: `#cfa-alertes-page-${pageNumber}`,
                        onClick: (e) => {
                          e.preventDefault();
                          setPage(pageNumber);
                        },
                      })}
                      showFirstLast
                    />
                    <div className={tableStyles.pageSizeSelector}>
                      <Select
                        label=""
                        options={PAGE_SIZES.map((size) => ({ value: size.toString(), label: `Voir par ${size}` }))}
                        nativeSelectProps={{
                          value: limit.toString(),
                          onChange: (e) => {
                            setLimit(Number(e.target.value));
                            setPage(1);
                          },
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </StatsErrorHandler>
        )}
      </div>
    </section>
  );
}
