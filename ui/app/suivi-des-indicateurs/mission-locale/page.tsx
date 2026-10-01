"use client";

import { Input } from "@codegouvfr/react-dsfr/Input";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

import { useStatsFilters } from "@/app/_components/statistiques/hooks/useStatsFilters";
import { ExportAllButton } from "@/app/_components/statistiques/sections/ExportAllButton";
import { OverviewSection } from "@/app/_components/statistiques/sections/OverviewSection";
import { TraitementRupturesPanel } from "@/app/_components/statistiques/sections/TraitementRupturesPanel";
import {
  TraitementMLTable,
  type TraitementMLSortColumn,
  type TraitementMLTableState,
} from "@/app/_components/statistiques/tables/TraitementMLTable";
import { StatsPageHeader } from "@/app/_components/statistiques/ui/StatsPageHeader";
import { StatsTabs } from "@/app/_components/statistiques/ui/StatsTabs";

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
  return (
    <div>
      <StatsPageHeader
        title="Missions Locales et suivi des ruptures"
        description={
          <>
            Retrouvez ici les chiffres des indicateurs principaux du déploiement et de l&apos;activité des Missions
            Locales sur le Tableau de bord de l&apos;apprentissage sur le territoire de votre choix. Aussi retrouvez les
            chiffres sur le traitement et le suivi des dossiers de jeune en rupture uniquement.
            <br />
            Pour changer de territoire et de période sur la visualisation des données, rendez-vous dans l&apos;en-tête
            de cette page.
          </>
        }
      />
      <StatsTabs
        tabs={[
          {
            id: "traitement",
            label: "Traitement et suivi des ruptures",
            iconId: "fr-icon-file-text-line",
            content: <TraitementRupturesPanel />,
          },
          {
            id: "deploiement",
            label: "Déploiement et activité des ML",
            iconId: "fr-icon-line-chart-line",
            content: <MissionLocalesPanel />,
          },
        ]}
      />
    </div>
  );
}

function MissionLocalesPanel() {
  const searchParams = useSearchParams();
  const { period, region, scope } = useStatsFilters();
  const [tableState] = useState(() => readTableState(searchParams));
  const [searchInput, setSearchInput] = useState(() => searchParams?.get("search") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchInput);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <OverviewSection title="Suivi traitement par Missions Locales">
      <div className={styles.controls}>
        <Input
          label="Rechercher une Mission Locale"
          hideLabel
          nativeInputProps={{
            placeholder: "Rechercher par nom de Mission Locale",
            value: searchInput,
            onChange: (e) => setSearchInput(e.target.value),
            type: "search",
          }}
          className={styles.searchInput}
        />
        <ExportAllButton label="Exporter les données" priority="secondary" {...scope} />
      </div>
      <TraitementMLTable
        period={period}
        segment="rupture"
        region={region}
        search={debouncedSearch}
        initialState={tableState}
      />
    </OverviewSection>
  );
}
