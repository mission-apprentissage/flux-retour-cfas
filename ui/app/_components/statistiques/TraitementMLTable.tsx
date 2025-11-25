"use client";

import { Pagination } from "@codegouvfr/react-dsfr/Pagination";
import { Select } from "@codegouvfr/react-dsfr/SelectNext";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { ITraitementMLStatsResponse, StatsPeriod } from "shared/models/data/nationalStats.model";

import { _get } from "@/common/httpClient";

import { TableSkeleton } from "./Skeleton";
import { SortableTableHeader } from "./SortableTableHeader";
import { STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA } from "./statistiques.config";
import { formatActivityDuration, formatPercentageBadge } from "./statistiques.utils";
import { TraitementDetailsBar } from "./TraitementDetailsBar";
import styles from "./TraitementTable.module.css";

interface TraitementMLTableProps {
  period: StatsPeriod;
}

type SortColumn = "nom" | "total_jeunes" | "a_traiter" | "traites" | "pourcentage_traites" | "jours_depuis_activite";

export function TraitementMLTable({ period }: TraitementMLTableProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortColumn, setSortColumn] = useState<SortColumn>("total_jeunes");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const { data, isLoading, isFetching } = useQuery<ITraitementMLStatsResponse>(
    ["mission-locale-stats", "traitement-ml", period, page, limit, sortColumn, sortDirection],
    () =>
      _get(`/api/v1/mission-locale/stats/traitement-ml`, {
        params: { period, page, limit, sort_by: sortColumn, sort_order: sortDirection },
      }),
    STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA
  );

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  useEffect(() => {
    if (data?.pagination && !isLoading) {
      const nextPage = page + 1;
      if (nextPage <= data.pagination.totalPages) {
        queryClient.prefetchQuery({
          queryKey: ["mission-locale-stats", "traitement-ml", period, nextPage, limit, sortColumn, sortDirection],
          queryFn: () =>
            _get(`/api/v1/mission-locale/stats/traitement-ml`, {
              params: { period, page: nextPage, limit, sort_by: sortColumn, sort_order: sortDirection },
            }),
          staleTime: STATS_QUERY_CONFIG_WITH_PREVIOUS_DATA.staleTime,
        });
      }
    }
  }, [data, isLoading, page, period, limit, sortColumn, sortDirection, queryClient]);

  if (isFetching) {
    return <TableSkeleton rows={limit} />;
  }

  const mlList = data?.data || [];
  const pagination = data?.pagination;

  if (mlList.length === 0) {
    return <p className={styles.emptyMessage}>Aucune donnée disponible.</p>;
  }

  return (
    <div className={styles.tableContainer}>
      <p className={styles.tableDescription}>
        <strong>Sur ce tableau :</strong> Suivez les statistiques de traitement des dossiers à l&apos;échelle des
        Missions locales. Par défaut, le tableau classe la présentation des Missions locales par leur dernière activité
        sur le service, vous pouvez modifier cet ordre en manipulant les options de tris.
      </p>
      <div className={`${styles.traitementTable} ${styles.mlTable}`}>
        <Table
          headers={[
            <SortableTableHeader
              key="nom"
              column="nom"
              label="Mission Locale"
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
            "Détails",
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
              key="jours_depuis_activite"
              column="jours_depuis_activite"
              label="Activité"
              currentSortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              centered
            />,
          ]}
          data={mlList.map((ml) => {
            const activity = formatActivityDuration(ml.jours_depuis_activite);
            return [
              ml.nom,
              <div className={styles.centeredCell} key={`total-${ml.id}`}>
                {ml.total_jeunes}
              </div>,
              <div className={styles.centeredCell} key={`a-traiter-${ml.id}`}>
                {ml.a_traiter}
              </div>,
              <div className={styles.centeredCell} key={`traites-${ml.id}`}>
                {ml.traites}
              </div>,
              <TraitementDetailsBar key={`details-${ml.id}`} details={ml.details} total={ml.traites} />,
              <div className={styles.centeredCell} key={`pct-${ml.id}`}>
                {formatPercentageBadge(ml.pourcentage_traites, ml.pourcentage_evolution)}
              </div>,
              <div className={`${styles.centeredCell} ${activity.className}`} key={`activity-${ml.id}`}>
                {activity.text}
              </div>,
            ];
          })}
        />
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className={styles.paginationContainer}>
          <Pagination
            key={page}
            count={pagination.totalPages}
            defaultPage={page}
            getPageLinkProps={(pageNumber) => ({
              href: `#page-${pageNumber}`,
              onClick: (e) => {
                e.preventDefault();
                handlePageChange(pageNumber);
              },
            })}
            showFirstLast
          />
          <div className={styles.pageSizeSelector}>
            <Select
              label=""
              options={[5, 10, 20, 50].map((size) => ({
                value: size.toString(),
                label: `Voir par ${size}`,
              }))}
              nativeSelectProps={{
                value: limit.toString(),
                onChange: (e) => handlePageSizeChange(Number(e.target.value)),
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
