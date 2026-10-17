"use client";

import { useMemo } from "react";
import { DEPARTEMENTS } from "shared/constants/territoires";

import { useStatsFilters } from "../hooks/useStatsFilters";

import { ChecklistFilter } from "./ChecklistFilter";

const departementsOf = (regionCode: string) => DEPARTEMENTS.filter((d) => d.region.code === regionCode);

/** Options du filtre : départements de la région de l'en-tête, sinon régions accessibles (dépliées en départements). */
function useTerritoireOptions() {
  const { region, territoireOptions } = useStatsFilters();
  return useMemo(
    () =>
      region
        ? departementsOf(region).map((d) => ({ value: d.code, label: `${d.nom} (${d.code})` }))
        : territoireOptions.filter((option) => option.value !== "france"),
    [region, territoireOptions]
  );
}

/** Départements de l'URL restreints au territoire de l'en-tête. */
export function useSelectedDepartements(departements: string[] | undefined) {
  const { region } = useStatsFilters();
  const options = useTerritoireOptions();
  return useMemo(() => {
    const allowed = new Set<string>(
      region ? options.map((o) => o.value) : options.flatMap((o) => departementsOf(o.value).map((d) => d.code))
    );
    return (departements ?? []).filter((code) => allowed.has(code));
  }, [departements, region, options]);
}

export function TerritoireFilter({
  departements,
  onChange,
}: {
  departements: string[] | undefined;
  onChange: (codes: string[]) => void;
}) {
  const { region, territoireLabel } = useStatsFilters();
  const options = useTerritoireOptions();
  const selectedDepartements = useSelectedDepartements(departements);

  const value = region
    ? selectedDepartements
    : options
        .filter((o) => {
          const codes = departementsOf(o.value).map((d) => d.code);
          return codes.length > 0 && codes.every((code) => selectedDepartements.includes(code));
        })
        .map((o) => o.value);

  return (
    <ChecklistFilter
      label={territoireLabel}
      options={options}
      value={value}
      onChange={(values) =>
        onChange(region ? values : values.flatMap((code) => departementsOf(code).map((d) => d.code)))
      }
      searchable={options.length > 8}
      searchPlaceholder="Rechercher un territoire"
      getDisplayText={(selected) =>
        selected.length === 0
          ? selectedDepartements.length > 0
            ? `${selectedDepartements.length} département${selectedDepartements.length > 1 ? "s" : ""}`
            : territoireLabel
          : selected.length === 1
            ? (options.find((o) => o.value === selected[0])?.label ?? territoireLabel)
            : `${selected.length} ${region ? "départements" : "régions"}`
      }
    />
  );
}
