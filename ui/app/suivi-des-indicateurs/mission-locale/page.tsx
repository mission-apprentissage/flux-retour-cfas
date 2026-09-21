"use client";

import { Input } from "@codegouvfr/react-dsfr/Input";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

import { ExportAllButton } from "@/app/_components/statistiques/sections/ExportAllButton";
import { StatisticsSection } from "@/app/_components/statistiques/sections/StatisticsSection";
import {
  TraitementMLTable,
  type TraitementMLSortColumn,
  type TraitementMLTableState,
} from "@/app/_components/statistiques/tables/TraitementMLTable";
import commonStyles from "@/app/_components/statistiques/ui/common.module.css";
import { PeriodSelector, type Period } from "@/app/_components/statistiques/ui/PeriodSelector";

import styles from "./page.module.css";

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

export default function MissionLocalePage() {
  return (
    <Suspense>
      <MissionLocalePageContent />
    </Suspense>
  );
}

function MissionLocalePageContent() {
  const searchParams = useSearchParams();
  const [tableState] = useState(() => readTableState(searchParams));
  const [period, setPeriod] = useState<Period>("30days");
  const [searchInput, setSearchInput] = useState(() => searchParams?.get("search") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchInput);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <div>
      <div className={commonStyles.headerContainer}>
        <div className={commonStyles.logoContainer}>
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M23 18.9999H22V8.99991H18V6.58569L12 0.585693L6 6.58569V8.99991H2V18.9999H1V20.9999H23V18.9999ZM6 19H4V11H6V19ZM18 11H20V19H18V11ZM11 12H13V19H11V12Z"
              fill="#6A6AF4"
            />
          </svg>
        </div>
        <h2 className={commonStyles.headerTitle}>Par Mission Locale</h2>
      </div>

      <div className={styles.searchContainer}>
        <Input
          label="Rechercher une Mission Locale"
          hideLabel
          nativeInputProps={{
            placeholder: "Rechercher une Mission Locale par nom…",
            value: searchInput,
            onChange: (e) => setSearchInput(e.target.value),
            type: "search",
          }}
          className={styles.searchInput}
        />
      </div>

      <StatisticsSection
        title="Toutes les Missions Locales"
        controls={
          <div className={styles.controls}>
            <PeriodSelector value={period} onChange={setPeriod} includeAll={true} hideLabel={true} />
            <ExportAllButton label="Exporter les données" />
          </div>
        }
        controlsPosition="below-left"
      >
        <TraitementMLTable period={period} segment="rupture" search={debouncedSearch} initialState={tableState} />
      </StatisticsSection>
    </div>
  );
}
