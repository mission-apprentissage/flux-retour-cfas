"use client";

import { Button } from "@codegouvfr/react-dsfr/Button";
import { Box, Checkbox, Typography } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useCallback } from "react";

import { _get } from "@/common/httpClient";
import {
  convertMissionLocaleFiltersToQuery,
  MissionLocaleFilters,
  MissionLocaleFiltersQuery,
  parseMissionLocaleFiltersFromQuery,
} from "@/modules/admin/mission-locale/model/mission-locale-filters";

const defaultFilters: MissionLocaleFilters = {
  rqth_only: false,
  mineur_only: false,
};

export const MissionLocaleFilterPanel = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const mlFilters = useMemo(() => {
    if (!searchParams) return defaultFilters;
    const query = Object.fromEntries(searchParams.entries());
    return parseMissionLocaleFiltersFromQuery(query as unknown as MissionLocaleFiltersQuery);
  }, [searchParams]);

  const updateFilters = useCallback(
    (newFilters: Partial<{ rqth_only: boolean; mineur_only: boolean }>) => {
      const updatedFilters = { ...mlFilters, ...newFilters };
      const queryParams = convertMissionLocaleFiltersToQuery(updatedFilters);

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
    [mlFilters, searchParams, router]
  );

  const resetFilters = useCallback(() => {
    router.push("?");
  }, [router]);

  const activeFiltersCount = Object.values(mlFilters).filter((value) =>
    Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && value !== ""
  ).length;

  const onMineurChange = () => {
    updateFilters({ mineur_only: !mlFilters.mineur_only });
  };

  const onRQTHChange = () => {
    updateFilters({ rqth_only: !mlFilters.rqth_only });
  };

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
            sm: "repeat(4, 1fr)",
            md: "repeat(4, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 2,
          "@media (max-width: 480px)": {
            gridTemplateColumns: "1fr",
          },
        }}
      >
        <Box
          sx={{
            overflow: "hidden",
          }}
        >
          Restreindre aux mineurs
          <Checkbox onChange={onMineurChange} checked={mlFilters.mineur_only}></Checkbox>
        </Box>
        <Box
          sx={{
            overflow: "hidden",
          }}
        >
          Restreindre aux RQTH
          <Checkbox onChange={onRQTHChange} checked={mlFilters.rqth_only}></Checkbox>
        </Box>
      </Box>
    </Box>
  );
};
