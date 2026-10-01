"use client";

import { Input } from "@codegouvfr/react-dsfr/Input";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DEPARTEMENTS } from "shared/constants/territoires";

import { OverviewCard } from "../cards/OverviewCard";
import { useMlTableFilters } from "../hooks/useMlTableFilters";
import { useStatsFilters } from "../hooks/useStatsFilters";
import {
  TraitementMLTable,
  type TraitementMLSortColumn,
  type TraitementMLTableState,
} from "../tables/TraitementMLTable";
import { ChecklistFilter } from "../ui/ChecklistFilter";

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
    ...([5, 10, 20, 50].includes(limit) ? { limit } : {}),
    ...(sortColumn && SORT_COLUMNS.includes(sortColumn) ? { sortColumn } : {}),
    ...(sortDirection === "asc" || sortDirection === "desc" ? { sortDirection } : {}),
  };
};

const departementsOf = (regionCode: string) => DEPARTEMENTS.filter((d) => d.region.code === regionCode);

const OUI_NON = [
  { value: "oui", label: "Oui" },
  { value: "non", label: "Non" },
];
const toChecklist = (value: boolean | undefined) => (value === undefined ? [] : [value ? "oui" : "non"]);
const fromChecklist = (values: string[]) => (values.length === 1 ? values[0] === "oui" : undefined);
const withChoice = (label: string, emptyLabel: string) => (selected: string[]) =>
  selected.length === 1 ? `${label} : ${selected[0] === "oui" ? "Oui" : "Non"}` : emptyLabel;

export function SuiviTraitementMLCard() {
  const searchParams = useSearchParams();
  const { period, region, scope, territoireLabel, territoireOptions } = useStatsFilters();
  const { filters, setDepartements, setUtiliseService, setEngagee } = useMlTableFilters();
  const [tableState] = useState(() => readTableState(searchParams));
  const [searchInput, setSearchInput] = useState(() => searchParams?.get("search") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchInput);
  const [total, setTotal] = useState<number>();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // En région : un choix par département. En France : un choix par région autorisée, traduit en départements.
  const territoryOptions = useMemo(
    () =>
      region
        ? departementsOf(region).map((d) => ({ value: d.code, label: `${d.nom} (${d.code})` }))
        : territoireOptions.filter((option) => option.value !== "france"),
    [region, territoireOptions]
  );

  const selectedDepartements = useMemo(() => {
    const allowed = new Set<string>(
      region
        ? departementsOf(region).map((d) => d.code)
        : territoryOptions.flatMap((o) => departementsOf(o.value).map((d) => d.code))
    );
    return (filters.departements ?? []).filter((code) => allowed.has(code));
  }, [filters.departements, region, territoryOptions]);

  const territoryValue = region
    ? selectedDepartements
    : territoryOptions
        .filter((o) => {
          const codes = departementsOf(o.value).map((d) => d.code);
          return codes.length > 0 && codes.every((code) => selectedDepartements.includes(code));
        })
        .map((o) => o.value);

  const handleTerritoryChange = (values: string[]) =>
    setDepartements(region ? values : values.flatMap((code) => departementsOf(code).map((d) => d.code)));

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
        <ChecklistFilter
          label={territoireLabel}
          options={territoryOptions}
          value={territoryValue}
          onChange={handleTerritoryChange}
          searchable={territoryOptions.length > 8}
          searchPlaceholder="Rechercher un territoire"
          getDisplayText={(selected) =>
            selected.length === 0
              ? territoireLabel
              : selected.length === 1
                ? (territoryOptions.find((o) => o.value === selected[0])?.label ?? territoireLabel)
                : `${selected.length} ${region ? "départements" : "régions"}`
          }
        />
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
        segment="rupture"
        region={region}
        search={debouncedSearch}
        initialState={tableState}
        filters={tableFilters}
        onTotalChange={setTotal}
        totalLabel="Total ruptures"
      />
    </OverviewCard>
  );
}
