"use client";

import { Input } from "@codegouvfr/react-dsfr/Input";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { OverviewCard } from "../cards/OverviewCard";
import { useMlTableFilters } from "../hooks/useMlTableFilters";
import { useStatsFilters } from "../hooks/useStatsFilters";
import { STATS_PAGE_SIZES } from "../tables/StatsTablePagination";
import {
  TraitementMLTable,
  type TraitementMLSortColumn,
  type TraitementMLTableState,
} from "../tables/TraitementMLTable";
import { ChecklistFilter } from "../ui/ChecklistFilter";
import { fromChecklist, OUI_NON, toChecklist, withChoice } from "../ui/ouiNonFilter";
import { TerritoireFilter, useSelectedDepartements } from "../ui/TerritoireFilter";

import { ExportAllButton } from "./ExportAllButton";
import styles from "./SuiviTraitementMLCard.module.css";

export const SUIVI_TRAITEMENT_ML_ANCHOR = "suivi-traitement-ml";

const SORT_COLUMNS: TraitementMLSortColumn[] = [
  "nom",
  "total_jeunes",
  "a_traiter",
  "traites",
  "pourcentage_traites",
  "delai_moyen_jours",
  "jours_depuis_activite",
];

const readTableState = (params: URLSearchParams | null): TraitementMLTableState => {
  const page = Number(params?.get("page"));
  const limit = Number(params?.get("limit"));
  const sortColumn = params?.get("sort_by") as TraitementMLSortColumn | null;
  const sortDirection = params?.get("sort_order");
  return {
    ...(Number.isInteger(page) && page > 0 ? { page } : {}),
    ...(STATS_PAGE_SIZES.includes(limit) ? { limit } : {}),
    ...(sortColumn && SORT_COLUMNS.includes(sortColumn) ? { sortColumn } : {}),
    ...(sortDirection === "asc" || sortDirection === "desc" ? { sortDirection } : {}),
  };
};

const SEGMENT_CONFIG = {
  rupture: { totalLabel: "Total ruptures", description: undefined, hideActivite: false, defaultSortColumn: undefined },
  collab: {
    totalLabel: "Total collab",
    hideActivite: true,
    defaultSortColumn: "total_jeunes",
    description:
      "Suivez les statistiques de traitement des dossiers de jeunes issus des collaborations sollicitées par les CFA uniquement. Toutes les Missions Locales du territoire ne reçoivent pas forcément de collaboration en raison du déploiement en cours du service auprès des CFA.",
  },
} as const;

export function SuiviTraitementMLCard({ segment = "rupture" }: { segment?: "rupture" | "collab" }) {
  const searchParams = useSearchParams();
  const { period, region, scope } = useStatsFilters();
  const { filters, setDepartements, setUtiliseService, setEngagee } = useMlTableFilters();
  const [tableState] = useState(() => readTableState(searchParams));
  const [searchInput, setSearchInput] = useState(() => searchParams?.get("search") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchInput);
  const [total, setTotal] = useState<number>();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const selectedDepartements = useSelectedDepartements(filters.departements);

  const tableFilters = useMemo(
    () => ({ ...filters, departements: selectedDepartements.length ? selectedDepartements : undefined }),
    [filters, selectedDepartements]
  );

  return (
    <OverviewCard
      id={SUIVI_TRAITEMENT_ML_ANCHOR}
      title="Suivi traitement par Missions Locales"
      actions={
        <>
          {total !== undefined && <span className={styles.count}>{total} ML</span>}
          <ExportAllButton label="Exporter les données" priority="secondary" {...scope} />
        </>
      }
    >
      <Input
        label="Rechercher une Mission Locale"
        hideLabel
        nativeInputProps={{
          placeholder: "Rechercher par nom de Mission Locale",
          value: searchInput,
          onChange: (e) => setSearchInput(e.target.value),
          type: "search",
        }}
        className={styles.search}
      />
      <div className={styles.filters}>
        <span className={styles.filtersLabel}>Filtrer</span>
        <TerritoireFilter departements={filters.departements} onChange={setDepartements} />
        <ChecklistFilter
          label="Utilisatrice TBA ?"
          options={OUI_NON}
          value={toChecklist(filters.utiliseService)}
          onChange={(values) => setUtiliseService(fromChecklist(values))}
          getDisplayText={withChoice("Utilisatrice TBA", "Utilisatrice TBA ?")}
        />
        <ChecklistFilter
          label="ML engagée"
          options={OUI_NON}
          value={toChecklist(filters.engagee)}
          onChange={(values) => setEngagee(fromChecklist(values))}
          getDisplayText={withChoice("ML engagée", "ML engagée")}
        />
      </div>
      <TraitementMLTable
        period={period}
        segment={segment}
        description={SEGMENT_CONFIG[segment].description}
        region={region}
        search={debouncedSearch}
        initialState={tableState}
        filters={tableFilters}
        onTotalChange={setTotal}
        totalLabel={SEGMENT_CONFIG[segment].totalLabel}
        hideActivite={SEGMENT_CONFIG[segment].hideActivite}
        defaultSortColumn={SEGMENT_CONFIG[segment].defaultSortColumn}
      />
    </OverviewCard>
  );
}
