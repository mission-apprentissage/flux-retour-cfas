"use client";

import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { format } from "date-fns/format";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { CfaEtablissementsSortBy, ICfaEtablissement } from "shared/models/data/nationalStats.model";

import { TableSkeleton } from "@/app/_components/common/Skeleton";

import { usePageForParams } from "../hooks/usePageForParams";
import { type CfaEtablissementsParams, useCfaEtablissements } from "../hooks/useStatsQueries";
import { StatsErrorHandler } from "../ui/StatsErrorHandler";
import { ficheCfaUrl } from "../utils";

import styles from "./CfaEtablissementsTable.module.css";
import { SortableTableHeader } from "./SortableTableHeader";
import { StatsTablePagination } from "./StatsTablePagination";

const COLUMNS: Array<{ column: CfaEtablissementsSortBy; label: string; centered?: boolean }> = [
  { column: "nom", label: "Raison sociale" },
  { column: "localisation", label: "Localisation" },
  { column: "compte", label: "Compte TBA ?", centered: true },
  { column: "collaborations", label: "Collaborations", centered: true },
  { column: "activite", label: "Activité", centered: true },
];

export function Localisation({ adresse }: { adresse: ICfaEtablissement["adresse"] }) {
  const ville = [adresse?.code_postal, adresse?.commune].filter(Boolean).join(" ");
  if (!adresse || (!ville && !adresse.complete)) return <span className={styles.emptyValue}>-</span>;
  const voie = ville && adresse.complete ? adresse.complete.replace(ville, "").trim() : null;
  return (
    <>
      {ville || adresse.complete}
      {voie && <span className={styles.voie}>{voie}</span>}
    </>
  );
}

interface CfaEtablissementsTableProps {
  params: CfaEtablissementsParams;
  onSort: (column: CfaEtablissementsSortBy) => void;
  onTotalChange: (total: number) => void;
  hasActiveFilters: boolean;
}

export function CfaEtablissementsTable({
  params,
  onSort,
  onTotalChange,
  hasActiveFilters,
}: CfaEtablissementsTableProps) {
  const [limit, setLimit] = useState(10);
  const [page, setPage] = usePageForParams(params);

  const { data, isLoading, isFetching, isPlaceholderData, error } = useCfaEtablissements({ ...params, page, limit });
  const rows = data?.data ?? [];
  const pagination = data?.pagination;

  useEffect(() => {
    if (pagination && !isPlaceholderData) onTotalChange(pagination.total);
  }, [pagination, isPlaceholderData, onTotalChange]);

  return (
    <div className={styles.tableContainer}>
      <StatsErrorHandler data={data} error={error} isLoading={isLoading}>
        {isLoading || (isFetching && isPlaceholderData) ? (
          <TableSkeleton rows={limit} />
        ) : rows.length === 0 ? (
          <p className={styles.emptyMessage}>
            {params.search
              ? `Aucun établissement trouvé pour "${params.search}"`
              : hasActiveFilters
                ? "Aucun établissement ne correspond à ces filtres."
                : "Aucun établissement sur ce territoire."}
          </p>
        ) : (
          <>
            <div className={styles.table}>
              <Table
                headers={COLUMNS.map(({ column, label, centered }) => (
                  <SortableTableHeader
                    key={column}
                    column={column}
                    label={label}
                    currentSortColumn={params.sort_by}
                    sortDirection={params.sort_order}
                    onSort={onSort}
                    centered={centered}
                  />
                ))}
                data={rows.map((row) => [
                  <div key={`nom-${row.id}`} className={styles.nameCell}>
                    <span className={styles.name}>{row.nom ?? "Raison sociale inconnue"}</span>
                    <span className={styles.meta}>
                      UAI : {row.uai ?? "—"} · SIRET : {row.siret}
                    </span>
                    <Link
                      href={ficheCfaUrl(row.id)}
                      className="fr-link fr-link--sm fr-link--icon-right fr-icon-arrow-right-line"
                    >
                      Voir la fiche
                    </Link>
                  </div>,
                  <Localisation key={`loc-${row.id}`} adresse={row.adresse} />,
                  <div key={`compte-${row.id}`} className={styles.centeredCell}>
                    <Badge as="span" noIcon small severity={row.has_account ? "success" : "error"}>
                      {row.has_account ? "Oui" : "Non"}
                    </Badge>
                  </div>,
                  <div key={`collab-${row.id}`} className={styles.centeredCell}>
                    {row.nb_collaborations}
                  </div>,
                  <div
                    key={`activite-${row.id}`}
                    className={`${styles.centeredCell} ${row.derniere_activite ? "" : styles.emptyValue}`}
                  >
                    {row.derniere_activite ? `le ${format(new Date(row.derniere_activite), "dd/MM/yyyy")}` : "-"}
                  </div>,
                ])}
              />
            </div>

            {pagination && (
              <StatsTablePagination
                page={page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
                limit={limit}
                onLimitChange={setLimit}
                label="établissements de formation"
              />
            )}
          </>
        )}
      </StatsErrorHandler>
    </div>
  );
}
