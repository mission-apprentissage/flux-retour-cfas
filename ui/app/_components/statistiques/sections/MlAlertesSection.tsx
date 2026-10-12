"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { IMlAlerteListeRow, MlAlerteListeSortBy, MlAlerteListeType } from "shared/models/data/nationalStats.model";

import { useMlAlertesExport } from "../hooks/useMlAlertesExport";
import { usePageForParams } from "../hooks/usePageForParams";
import { useSortableTable } from "../hooks/useSortableTable";
import { useStatsFilters } from "../hooks/useStatsFilters";
import { useMlAlertes } from "../hooks/useStatsQueries";
import tableStyles from "../tables/CfaEtablissementsTable.module.css";
import { SortableTableHeader } from "../tables/SortableTableHeader";
import { formatActivityDuration, formatPercentageBadgeSimple } from "../utils";

import { AlerteCard, AlertesSection } from "./AlerteCard";
import styles from "./CfaAlertesSection.module.css";
import mlStyles from "./MlAlertesSection.module.css";

interface Colonne {
  column: MlAlerteListeSortBy;
  label: string;
  centered?: boolean;
  cellule: (row: IMlAlerteListeRow) => ReactNode;
}

function NomMl({ row }: { row: IMlAlerteListeRow }) {
  return (
    <div className={`${tableStyles.nameCell} ${mlStyles.nom}`}>
      <span className={tableStyles.name}>{row.nom}</span>
      <Link
        href={`/suivi-des-indicateurs/mission-locale/${row.id}`}
        className="fr-link fr-link--sm fr-link--icon-right fr-icon-arrow-right-line"
        aria-label={`Voir la fiche de ${row.nom}`}
      >
        Voir la fiche
      </Link>
    </div>
  );
}

const centre = (contenu: ReactNode) => <div className={tableStyles.centeredCell}>{contenu}</div>;

const COLONNES = {
  nom: { column: "nom", label: "Mission Locale", cellule: (row) => <NomMl row={row} /> },
  localisation: {
    column: "localisation",
    label: "Localisation",
    cellule: (row) => [row.code_postal, row.commune].filter(Boolean).join(" ") || "-",
  },
  totalRuptures: {
    column: "total_jeunes",
    label: "Total ruptures",
    centered: true,
    cellule: (row) => centre(row.total_jeunes.toLocaleString("fr-FR")),
  },
  aTraiter: {
    column: "a_traiter",
    label: "À traiter",
    centered: true,
    cellule: (row) => (
      <div className={mlStyles.empile}>
        {row.a_traiter.toLocaleString("fr-FR")}
        {row.a_recontacter > 0 && (
          <span className={mlStyles.mention}>et {row.a_recontacter.toLocaleString("fr-FR")} à recontacter</span>
        )}
      </div>
    ),
  },
  pourcentageTraites: {
    column: "pourcentage_traites",
    label: "% Traités",
    centered: true,
    cellule: (row) => centre(formatPercentageBadgeSimple(row.pourcentage_traites)),
  },
  activite: {
    column: "activite",
    label: "Activité",
    centered: true,
    cellule: (row) => {
      const { text, className } = formatActivityDuration(row.jours_depuis_activite);
      return <div className={`${tableStyles.centeredCell} ${className}`}>{text}</div>;
    },
  },
} satisfies Record<string, Colonne>;

function MlAlerte({
  type,
  titre,
  colonnes,
  triParDefaut,
}: {
  type: MlAlerteListeType;
  titre: ReactNode;
  colonnes: Colonne[];
  triParDefaut: MlAlerteListeSortBy;
}) {
  const { region } = useStatsFilters();
  const [limit, setLimit] = useState(10);
  const sort = useSortableTable<MlAlerteListeSortBy>(triParDefaut, "desc", {
    columnDefaultDirections: { nom: "asc", localisation: "asc", activite: "asc" },
  });
  const params = { region, sort_by: sort.sortColumn, sort_order: sort.sortDirection };
  const [page, setPage] = usePageForParams(params);
  const query = useMlAlertes(type, { ...params, page, limit });
  const exporter = useMlAlertesExport(type, params);

  return (
    <AlerteCard
      title={titre}
      query={query}
      loadingRows={query.isLoading || (query.isFetching && query.isPlaceholderData)}
      exporter={exporter}
      headers={colonnes.map(({ column, label, centered }) => (
        <SortableTableHeader
          key={column}
          column={column}
          label={label}
          currentSortColumn={sort.sortColumn}
          sortDirection={sort.sortDirection}
          onSort={sort.handleSort}
          centered={centered}
        />
      ))}
      rows={(query.data?.data ?? []).map((row) =>
        colonnes.map(({ column, cellule }) => <div key={column}>{cellule(row)}</div>)
      )}
      page={page}
      onPageChange={setPage}
      limit={limit}
      onLimitChange={setLimit}
      unite="ML"
      libellePagination="ML en alerte"
      tableClassName={mlStyles.tableMl}
    />
  );
}

/** Onglet Ruptures, réservé à l'admin : les ML activées qui ne sont pas engagées. */
export function MlRupturesAlertesSection() {
  return (
    <AlertesSection>
      <MlAlerte
        type="non_engagee"
        titre={
          <>
            Les Missions Locales <span className={styles.highlight}>qui ne sont pas « Missions Locales engagées »</span>
          </>
        }
        colonnes={[
          COLONNES.nom,
          COLONNES.totalRuptures,
          COLONNES.aTraiter,
          COLONNES.pourcentageTraites,
          COLONNES.activite,
        ]}
        triParDefaut="total_jeunes"
      />
    </AlertesSection>
  );
}
