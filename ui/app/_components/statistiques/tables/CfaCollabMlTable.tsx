"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Table } from "@codegouvfr/react-dsfr/Table";
import Link from "next/link";
import { useState } from "react";
import type { CfaCollabMlSortBy } from "shared/models/data/nationalStats.model";

import { TableSkeleton } from "@/app/_components/common/Skeleton";

import { usePageForParams } from "../hooks/usePageForParams";
import { useCfaCollabMl } from "../hooks/useStatsQueries";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";

import styles from "./CfaEtablissementsTable.module.css";
import ficheTableStyles from "./FicheTable.module.css";
import { SortableTableHeader } from "./SortableTableHeader";
import { StatsTablePagination } from "./StatsTablePagination";

export function CfaCollabMlTable({ organismeId }: { organismeId: string }) {
  const [sort, setSort] = useState<{ sort_by: CfaCollabMlSortBy; sort_order: "asc" | "desc" }>({
    sort_by: "envoyees",
    sort_order: "desc",
  });
  const [limit, setLimit] = useState(10);
  const [page, setPage] = usePageForParams({ organismeId, ...sort, limit });
  const { data, isLoading, isFetching, isPlaceholderData, error } = useCfaCollabMl({
    organismeId,
    ...sort,
    page,
    limit,
  });

  const onSort = (column: CfaCollabMlSortBy) =>
    setSort((previous) => ({
      sort_by: column,
      sort_order: previous.sort_by === column && previous.sort_order === "desc" ? "asc" : "desc",
    }));

  const entete = (column: CfaCollabMlSortBy, label: string) => (
    <SortableTableHeader
      column={column}
      label={label}
      currentSortColumn={sort.sort_by}
      sortDirection={sort.sort_order}
      onSort={onSort}
      centered
    />
  );

  return (
    <div className={styles.tableContainer}>
      <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
        {isLoading || (isFetching && isPlaceholderData) ? (
          <TableSkeleton rows={Math.min(limit, 5)} />
        ) : !data || data.data.length === 0 ? (
          <p className={styles.emptyMessage}>
            Ce CFA n&apos;a pas fait de collaborations avec les Missions Locales pour le moment.
          </p>
        ) : (
          <>
            <div className={styles.table}>
              <Table
                className={ficheTableStyles.table}
                headers={[
                  "Mission Locale",
                  entete("envoyees", "Total collab envoyées"),
                  entete("a_traiter", "Collab à traiter"),
                  entete("traitees", "Collab traitées"),
                ]}
                data={data.data.map((row) => [
                  <div key={`nom-${row.mission_locale_id}`} className={styles.nameCell}>
                    <span className={styles.name}>{row.nom ?? "Mission Locale inconnue"}</span>
                    <span className={styles.meta}>{[row.code_postal, row.commune].filter(Boolean).join(" ")}</span>
                    {!row.utilise_service && (
                      <Badge as="span" severity="error" small>
                        N&apos;utilise pas le service
                      </Badge>
                    )}
                    {row.mission_locale_id && (
                      <Link
                        href={`/suivi-des-indicateurs/mission-locale/${row.mission_locale_id}?from=cfa&cfa_id=${organismeId}`}
                        className="fr-link fr-link--sm fr-link--icon-right fr-icon-arrow-right-line"
                        aria-label={`Voir la fiche de ${row.nom ?? "la Mission Locale"}`}
                      >
                        Voir la fiche
                      </Link>
                    )}
                  </div>,
                  <div key={`envoyees-${row.mission_locale_id}`} className={styles.centeredCell}>
                    {row.envoyees.toLocaleString("fr-FR")}
                  </div>,
                  <div key={`a-traiter-${row.mission_locale_id}`} className={styles.centeredCell}>
                    {row.a_traiter.toLocaleString("fr-FR")}
                    {row.a_recontacter > 0 && (
                      <span className={styles.meta}>+ {row.a_recontacter.toLocaleString("fr-FR")} à recontacter</span>
                    )}
                  </div>,
                  <div key={`traitees-${row.mission_locale_id}`} className={styles.centeredCell}>
                    {row.traitees.toLocaleString("fr-FR")}
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
              label="Missions Locales destinataires"
            />
          </>
        )}
      </StatsErrorHandler>
    </div>
  );
}
