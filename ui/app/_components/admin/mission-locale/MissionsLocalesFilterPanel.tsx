"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Box, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useCallback } from "react";
import { IOrganisationARML } from "shared";

import { _get } from "@/common/httpClient";
import {
  ARMLFilters,
  ARMLFiltersQuery,
  convertARMLFiltersToQuery,
  parseARMLFiltersFromQuery,
} from "@/modules/admin/arml/model/arml-filters";

import { MultiSelectDropdown } from "../MultiSelectDropdown";

interface FilterConfig {
  key: keyof ARMLFilters;
  label: string;
  placeholder: string;
  options: { value: string; label: string }[];
}

const defaultFilters: ARMLFilters = {
  arml: [],
};

export const MissionsLocalesFilterPanel = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: armls } = useQuery<Array<IOrganisationARML>>(["arml"], async () => _get("/api/v1/mission-locale/arml"));

  const ARML_OPTIONS = useMemo(
    () =>
      armls
        ?.map((arml) => ({ value: arml._id.toString(), label: arml.nom }))
        .sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" })),
    [armls]
  );

  const usersFilters = useMemo(() => {
    if (!searchParams) return defaultFilters;
    const query = Object.fromEntries(searchParams.entries());
    return parseARMLFiltersFromQuery(query as unknown as ARMLFiltersQuery);
  }, [searchParams]);

  const filtersConfig: FilterConfig[] = [
    {
      key: "arml",
      label: "ARML",
      placeholder: "Toutes les armls",
      options: ARML_OPTIONS || [],
    },
  ];

  const updateFilters = useCallback(
    (newFilters: Partial<{ arml: string[] }>) => {
      const updatedFilters = { ...usersFilters, ...newFilters };
      const queryParams = convertARMLFiltersToQuery(updatedFilters);

      if (!searchParams) return;

      const newSearchParams = new URLSearchParams();

      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => newSearchParams.append(key, v));
          } else {
            newSearchParams.set(key, String(value));
          }
        }
      });

      router.push(`?${newSearchParams.toString()}`);
    },
    [usersFilters, searchParams, router]
  );

  const resetFilters = useCallback(() => {
    router.push("?");
  }, [router]);

  const activeFiltersCount = Object.values(usersFilters).filter((value) =>
    Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && value !== ""
  ).length;

  return (
    <Box
      sx={{
        border: "1px solid var(--border-default-grey)",
        borderRadius: "var(--spacing-1v)",
        p: { xs: 2, sm: 3 },
        backgroundColor: "var(--background-alt-grey)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexDirection: { xs: "column", sm: "row" },
          gap: { xs: 2, sm: 0 },
        }}
      >
        <Typography variant="h6" sx={{ fontSize: "1rem", fontWeight: 700 }}>
          Filtres {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </Typography>

        {activeFiltersCount > 0 && (
          <Button onClick={resetFilters} priority="secondary" size="small" iconId="fr-icon-refresh-line">
            Réinitialiser
          </Button>
        )}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(5, 1fr)",
          },
          gap: 2,
          "@media (max-width: 480px)": {
            gridTemplateColumns: "1fr",
          },
        }}
      >
        {filtersConfig.map((filter) => (
          <Box
            key={filter.key}
            sx={{
              overflow: "hidden",
            }}
          >
            <MultiSelectDropdown
              label={filter.label}
              options={filter.options}
              value={usersFilters[filter.key] || []}
              onChange={(values) => updateFilters({ [filter.key]: values })}
              placeholder={filter.placeholder}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
};
