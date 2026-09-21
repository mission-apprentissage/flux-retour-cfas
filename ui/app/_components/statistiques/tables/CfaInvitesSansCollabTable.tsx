"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import Link from "next/link";
import { useCallback, useState } from "react";
import type {
  ICfaInviteSansCollabRow,
  ICfaInvitesSortBy,
} from "shared/models/routes/admin/cfa-invites-sans-collab.api";

import { TableSkeleton } from "@/app/_components/common/Skeleton";

import { useCfaInvitesSansCollab } from "../hooks/useCfaInvitesSansCollab";
import { useSortableTable } from "../hooks/useSortableTable";
import { StatisticsSection } from "../sections/StatisticsSection";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import styles from "./CfaInvitesSansCollabTable.module.css";
import { SortableTableHeader } from "./SortableTableHeader";

const PAGE_SIZES = [10, 20, 50];

function formatLocalisation(adresse: ICfaInviteSansCollabRow["adresse"]): string | null {
  if (!adresse) return null;
  const parts = [adresse.code_postal, adresse.commune].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : adresse.complete;
}

export function CfaInvitesSansCollabTable() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const resetPage = useCallback(() => setPage(1), []);
  const { sortColumn, sortDirection, handleSort } = useSortableTable<ICfaInvitesSortBy>("invitations", "desc", {
    onSortChange: resetPage,
  });

  const { data, isLoading, isFetching, error } = useCfaInvitesSansCollab({
    page,
    limit,
    sort_by: sortColumn,
    sort_order: sortDirection,
  });

  const rows = data?.data ?? [];
  const pagination = data?.pagination;

  const controls = (
    <div className={styles.controls}>
      <Tooltip
        kind="hover"
        title="CFA ayant reçu au moins une invitation d'une Mission Locale et n'ayant encore envoyé aucun dossier de collaboration. Un CFA sort de cette liste dès son premier dossier envoyé."
      />
      {data && (
        <Badge noIcon severity="info">
          {data.total.toLocaleString("fr-FR")} CFA
        </Badge>
      )}
    </div>
  );

  return (
    <StatisticsSection
      title="Les CFA ont reçu des invitations des Missions Locales mais n'ont pas encore fait de collaborations"
      controls={controls}
      wrapTitle
    >
      <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
        {isLoading || isFetching ? (
          <TableSkeleton rows={Math.min(limit, 10)} />
        ) : rows.length === 0 ? (
          <p className={styles.emptyMessage}>Aucun CFA invité en attente.</p>
        ) : (
          <div className={styles.tableContainer}>
            <div className={styles.table}>
              <Table
                headers={[
                  "Raison sociale",
                  <SortableTableHeader
                    key="localisation"
                    column="localisation"
                    label="Localisation"
                    currentSortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />,
                  <SortableTableHeader
                    key="invitations"
                    column="invitations"
                    label="Invitations reçues"
                    currentSortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    centered
                  />,
                ]}
                data={rows.map((row) => {
                  const localisation = formatLocalisation(row.adresse);
                  return [
                    <div key={`cfa-${row.organisme_id}`} className={styles.nameCell}>
                      <span className={styles.name}>{row.raison_sociale ?? "Raison sociale inconnue"}</span>
                      <span className={styles.meta}>
                        UAI : {row.uai ?? "—"} · SIRET : {row.siret}
                      </span>
                      <Link href={`/admin/organismes/recherche/${row.siret}`} className="fr-link fr-link--sm">
                        Voir la fiche
                      </Link>
                    </div>,
                    <span key={`loc-${row.organisme_id}`} className={localisation ? "" : styles.emptyValue}>
                      {localisation ?? "-"}
                    </span>,
                    <div key={`inv-${row.organisme_id}`} className={styles.centeredCell}>
                      {row.invitations_recues}
                    </div>,
                  ];
                })}
              />
            </div>

            {pagination && pagination.total_pages > 1 && (
              <div className={styles.paginationContainer}>
                <Pagination
                  key={page}
                  count={pagination.total_pages}
                  defaultPage={page}
                  getPageLinkProps={(pageNumber) => ({
                    href: `#cfa-invites-page-${pageNumber}`,
                    onClick: (e) => {
                      e.preventDefault();
                      setPage(pageNumber);
                    },
                  })}
                  showFirstLast
                />
                <div className={styles.pageSizeSelector}>
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
    </StatisticsSection>
  );
}
