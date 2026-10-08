"use client";

import { Table } from "@codegouvfr/react-dsfr/Table";
import Link from "next/link";
import { useState } from "react";
import type { CollabCfaOrigineSortBy } from "shared/models/data/nationalStats.model";

import { TableSkeleton } from "@/app/_components/common/Skeleton";

import { usePageForParams } from "../hooks/usePageForParams";
import { useCollabCfaOrigine } from "../hooks/useStatsQueries";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";
import { ficheCfaUrl } from "../utils";

import { Localisation } from "./CfaEtablissementsTable";
import styles from "./CfaEtablissementsTable.module.css";
import ficheTableStyles from "./FicheTable.module.css";
import { SortableTableHeader } from "./SortableTableHeader";
import { StatsTablePagination } from "./StatsTablePagination";

export function CollabCfaOrigineTable({ mlId }: { mlId: string }) {
  const [sort, setSort] = useState<{ sort_by: CollabCfaOrigineSortBy; sort_order: "asc" | "desc" }>({
    sort_by: "collaborations",
    sort_order: "desc",
  });
  const [limit, setLimit] = useState(10);
  const [page, setPage] = usePageForParams({ mlId, ...sort, limit });
  const { data, isLoading, isFetching, isPlaceholderData, error } = useCollabCfaOrigine({
    mlId,
    ...sort,
    page,
    limit,
  });

  const onSort = (column: CollabCfaOrigineSortBy) =>
    setSort((previous) => ({
      sort_by: column,
      sort_order: previous.sort_by === column && previous.sort_order === "desc" ? "asc" : "desc",
    }));

  const sortableHeader = (column: CollabCfaOrigineSortBy, label: string, centered?: boolean) => (
    <SortableTableHeader
      column={column}
      label={label}
      currentSortColumn={sort.sort_by}
      sortDirection={sort.sort_order}
      onSort={onSort}
      centered={centered}
    />
  );

  return (
    <div className={styles.tableContainer}>
      <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
        {isLoading || (isFetching && isPlaceholderData) ? (
          <TableSkeleton rows={Math.min(limit, 5)} />
        ) : !data || data.data.length === 0 ? (
          <p className={styles.emptyMessage}>Aucune collaboration reçue par cette Mission Locale.</p>
        ) : (
          <>
            <div className={styles.table}>
              <Table
                className={ficheTableStyles.table}
                headers={[
                  "Raison sociale",
                  sortableHeader("localisation", "Localisation"),
                  sortableHeader("collaborations", "Collab reçues", true),
                ]}
                data={data.data.map((row) => [
                  <div key={`nom-${row.organisme_id}`} className={styles.nameCell}>
                    <span className={styles.name}>{row.nom ?? "Raison sociale inconnue"}</span>
                    <span className={styles.meta}>
                      UAI : {row.uai ?? "—"} · SIRET : {row.siret ?? "—"}
                    </span>
                    {row.organisme_id && (
                      <Link
                        href={ficheCfaUrl(row.organisme_id, { from: "ml", ml_id: mlId })}
                        className="fr-link fr-link--sm fr-link--icon-right fr-icon-arrow-right-line"
                      >
                        Voir la fiche
                      </Link>
                    )}
                  </div>,
                  <Localisation
                    key={`loc-${row.organisme_id}`}
                    adresse={{ code_postal: row.code_postal, commune: row.commune, complete: row.adresse }}
                  />,
                  <div key={`collab-${row.organisme_id}`} className={styles.centeredCell}>
                    {row.collaborations.toLocaleString("fr-FR")}
                  </div>,
                ])}
              />
            </div>
            <StatsTablePagination
              page={page}
              totalPages={data.pagination.total_pages}
              onPageChange={setPage}
              limit={limit}
              onLimitChange={setLimit}
              label="CFA à l'origine des collaborations"
            />
          </>
        )}
      </StatsErrorHandler>
    </div>
  );
}
