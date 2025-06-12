"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Box, Typography } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useCallback } from "react";
import { DEPARTEMENTS_BY_CODE, REGIONS_BY_CODE, TYPES_ORGANISATION } from "shared";

import { USER_STATUS_LABELS } from "@/common/constants/usersConstants";
import {
  UsersFilters,
  UsersFiltersQuery,
  convertUsersFiltersToQuery,
  parseUsersFiltersFromQuery,
} from "@/modules/admin/users/models/users-filters";
import { useTeteDeReseaux } from "@/modules/dashboard/hooks/useTeteDeReseaux";

import { MultiSelectDropdown } from "./MultiSelectDropdown";

interface FilterConfig {
  key: keyof UsersFilters;
  label: string;
  placeholder: string;
  options: { value: string; label: string }[];
}

interface OptionItem {
  value: string;
  label: string;
}

const createOptionsFromObject = (obj: Record<string, any>): OptionItem[] =>
  Object.entries(obj)
    .map(([code, item]) => ({
      value: code,
      label: typeof item === "object" && item?.nom ? item.nom : String(item),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }));

const DEPARTEMENTS_OPTIONS = createOptionsFromObject(DEPARTEMENTS_BY_CODE);
const REGIONS_OPTIONS = createOptionsFromObject(REGIONS_BY_CODE);
const TYPES_ORGANISATION_OPTIONS = TYPES_ORGANISATION.map((type) => ({
  value: type.key,
  label: type.nom,
})).sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }));

const defaultFilters: UsersFilters = {
  type_utilisateur: [],
  account_status: [],
  reseaux: [],
  departements: [],
  regions: [],
};

export const UsersFiltersPanel = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: reseaux, isLoading: isLoadingReseaux } = useTeteDeReseaux();

  const usersFilters = useMemo(() => {
    if (!searchParams) return defaultFilters;
    const query = Object.fromEntries(searchParams.entries());
    return parseUsersFiltersFromQuery(query as unknown as UsersFiltersQuery);
  }, [searchParams]);

  const reseauxOptions = useMemo(() => {
    if (!reseaux) return [];
    return reseaux
      .map((reseau: any) => ({
        value: reseau.key,
        label: reseau.nom,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }));
  }, [reseaux]);

  const statusOptions = useMemo(
    () =>
      [
        { value: "CONFIRMED", label: USER_STATUS_LABELS.CONFIRMED },
        { value: "PENDING_EMAIL_VALIDATION", label: USER_STATUS_LABELS.PENDING_EMAIL_VALIDATION },
        { value: "PENDING_ADMIN_VALIDATION", label: USER_STATUS_LABELS.PENDING_ADMIN_VALIDATION },
      ].sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" })),
    []
  );

  const filtersConfig: FilterConfig[] = useMemo(
    () => [
      {
        key: "departements",
        label: "Département",
        placeholder: "Tous les départements",
        options: DEPARTEMENTS_OPTIONS,
      },
      {
        key: "regions",
        label: "Région",
        placeholder: "Toutes les régions",
        options: REGIONS_OPTIONS,
      },
      {
        key: "type_utilisateur",
        label: "Type d'utilisateur",
        placeholder: "Tous les types",
        options: TYPES_ORGANISATION_OPTIONS,
      },
      {
        key: "reseaux",
        label: "Réseau",
        placeholder: "Tous les réseaux",
        options: reseauxOptions,
      },
      {
        key: "account_status",
        label: "Statut du compte",
        placeholder: "Tous les statuts",
        options: statusOptions,
      },
    ],
    [reseauxOptions, statusOptions]
  );

  const updateFilters = useCallback(
    (newFilters: Partial<UsersFilters>) => {
      const updatedFilters = { ...usersFilters, ...newFilters };
      const queryParams = convertUsersFiltersToQuery(updatedFilters);

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
              placeholder={filter.key === "reseaux" && isLoadingReseaux ? "Chargement..." : filter.placeholder}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
};
