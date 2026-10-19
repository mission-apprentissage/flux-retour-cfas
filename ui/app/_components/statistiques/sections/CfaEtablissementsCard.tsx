"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CfaEtablissementsSortBy } from "shared/models/data/nationalStats.model";

import { OverviewCard } from "../cards/OverviewCard";
import { useCfaEtablissementsExport } from "../hooks/useCfaEtablissementsExport";
import { useCfaTableFilters } from "../hooks/useCfaTableFilters";
import { useSortableTable } from "../hooks/useSortableTable";
import { useStatsFilters } from "../hooks/useStatsFilters";
import type { CfaEtablissementsParams } from "../hooks/useStatsQueries";
import { CfaEtablissementsTable } from "../tables/CfaEtablissementsTable";
import { ChecklistFilter } from "../ui/ChecklistFilter";
import { fromChecklist, OUI_NON, toChecklist, withChoice } from "../ui/ouiNonFilter";
import { TerritoireFilter, useSelectedDepartements } from "../ui/TerritoireFilter";

import styles from "./SuiviTraitementMLCard.module.css";

const NATURE_OPTIONS = [
  { value: "responsable", label: "Responsable" },
  { value: "formateur", label: "Formateur" },
  { value: "responsable_formateur", label: "Responsable formateur" },
  { value: "inconnue", label: "Inconnue" },
];

const COLLABORATION_OPTIONS = [
  { value: "oui", label: "Actives" },
  { value: "non", label: "Aucune" },
];

export function CfaEtablissementsCard() {
  const { region } = useStatsFilters();
  const { filters, setDepartements, setNatures, setUtilisateur, setQualiopi, setCollabActive } = useCfaTableFilters();
  const selectedDepartements = useSelectedDepartements(filters.departements);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState<number>();
  const { sortColumn, sortDirection, handleSort } = useSortableTable<CfaEtablissementsSortBy>(
    "collaborations",
    "desc",
    { columnDefaultDirections: { nom: "asc", localisation: "asc" } }
  );

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const previousRegion = useRef(region);
  useEffect(() => {
    if (previousRegion.current === region) return;
    previousRegion.current = region;
    if (filters.departements) setDepartements([]);
  }, [region, filters.departements, setDepartements]);

  const params = useMemo<CfaEtablissementsParams>(
    () => ({
      region,
      departements: selectedDepartements.length ? selectedDepartements : undefined,
      search: search.length >= 2 ? search : undefined,
      natures: filters.natures,
      utilisateur: filters.utilisateur,
      qualiopi: filters.qualiopi,
      collab_active: filters.collabActive,
      sort_by: sortColumn,
      sort_order: sortDirection,
    }),
    [region, selectedDepartements, search, filters, sortColumn, sortDirection]
  );
  const { exportData, isExporting, error: exportError, clearError } = useCfaEtablissementsExport(params);

  const hasActiveFilters =
    selectedDepartements.length > 0 ||
    !!filters.natures?.length ||
    filters.utilisateur !== undefined ||
    filters.qualiopi !== undefined ||
    filters.collabActive !== undefined;

  return (
    <OverviewCard
      title="Les établissements de formation du territoire"
      actions={
        <>
          {total !== undefined && <span className={styles.count}>{total.toLocaleString("fr-FR")} CFA</span>}
          <Button
            iconId="fr-icon-download-line"
            iconPosition="right"
            priority="secondary"
            onClick={exportData}
            disabled={isExporting}
          >
            {isExporting ? "Export en cours..." : "Exporter les données"}
          </Button>
        </>
      }
    >
      {exportError && (
        <Alert severity="error" title="Erreur" description={exportError} closable onClose={clearError} small />
      )}
      <Input
        label="Rechercher un établissement"
        hideLabel
        nativeInputProps={{
          placeholder: "Rechercher par nom d'établissement, UAI, SIRET, commune…",
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
          label="Nature"
          options={NATURE_OPTIONS}
          value={filters.natures ?? []}
          onChange={setNatures}
          getDisplayText={(selected) =>
            selected.length === 1
              ? `Nature : ${NATURE_OPTIONS.find((o) => o.value === selected[0])?.label}`
              : selected.length > 1
                ? `${selected.length} natures`
                : "Nature"
          }
        />
        <ChecklistFilter
          label="Utilisateur TBA ?"
          options={OUI_NON}
          value={toChecklist(filters.utilisateur)}
          onChange={(values) => setUtilisateur(fromChecklist(values))}
          getDisplayText={withChoice("Utilisateur TBA", "Utilisateur TBA ?")}
        />
        <ChecklistFilter
          label="Certification Qualiopi"
          options={OUI_NON}
          value={toChecklist(filters.qualiopi)}
          onChange={(values) => setQualiopi(fromChecklist(values))}
          getDisplayText={withChoice("Qualiopi", "Certification Qualiopi")}
        />
        <ChecklistFilter
          label="Collaborations"
          options={COLLABORATION_OPTIONS}
          value={toChecklist(filters.collabActive)}
          onChange={(values) => setCollabActive(fromChecklist(values))}
          getDisplayText={(selected) =>
            selected.length === 1
              ? `Collaborations : ${selected[0] === "oui" ? "Actives" : "Aucune"}`
              : "Collaborations"
          }
        />
      </div>
      <CfaEtablissementsTable
        params={params}
        onSort={handleSort}
        onTotalChange={setTotal}
        hasActiveFilters={hasActiveFilters}
      />
    </OverviewCard>
  );
}
