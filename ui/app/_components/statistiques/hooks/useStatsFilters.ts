import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { zStatsPeriod, type StatsPeriod } from "shared/models/data/nationalStats.model";

import { useAuth } from "@/app/_context/UserContext";
import { isAdminUser, TOUTES_REGIONS_CODES } from "@/app/suivi-des-indicateurs/access";

import { getRegionLabel } from "../utils";

import { useUserRegions } from "./useUserRegions";

export const TERRITOIRE_FRANCE = "france";
export const STATS_FILTER_PARAMS = ["periode", "territoire"] as const;

const DEFAULT_PERIOD: StatsPeriod = "30days";

/** Query string des filtres de stats, à reporter sur les liens entre onglets. */
export function buildStatsFiltersQuery(searchParams: Pick<URLSearchParams, "get"> | null) {
  const query = new URLSearchParams();
  STATS_FILTER_PARAMS.forEach((key) => {
    const value = searchParams?.get(key);
    if (value) query.set(key, value);
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export interface TerritoireOption {
  value: string;
  label: string;
}

export function useStatsFilters() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { regions: ownRegions, isLoading } = useUserRegions();

  const isAdmin = isAdminUser(user ?? null);
  const defaultTerritoire = !isAdmin && ownRegions.length === 1 ? ownRegions[0] : TERRITOIRE_FRANCE;

  const territoireOptions = useMemo<TerritoireOption[]>(
    () => [
      { value: TERRITOIRE_FRANCE, label: "France" },
      ...TOUTES_REGIONS_CODES.map((code) => ({ value: code, label: getRegionLabel(code) })),
    ],
    []
  );

  const parsedPeriod = zStatsPeriod.safeParse(searchParams?.get("periode"));
  const period = parsedPeriod.success ? parsedPeriod.data : DEFAULT_PERIOD;

  const requestedTerritoire = searchParams?.get("territoire");
  const territoire =
    requestedTerritoire && territoireOptions.some((option) => option.value === requestedTerritoire)
      ? requestedTerritoire
      : defaultTerritoire;

  const setParam = useCallback(
    (key: (typeof STATS_FILTER_PARAMS)[number], value: string) => {
      const params = new URLSearchParams(searchParams?.toString());
      params.set(key, value);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const region = territoire === TERRITOIRE_FRANCE ? undefined : territoire;

  return {
    period,
    territoire,
    territoireLabel: region ? getRegionLabel(region) : "France",
    territoireOptions,
    region,
    /** Paramètres de périmètre attendus par les routes territoriales `indicateurs-ml`. */
    scope: region ? { region } : { national: true as const },
    isLoading,
    setPeriod: (value: StatsPeriod) => setParam("periode", value),
    setTerritoire: (value: string) => setParam("territoire", value),
  };
}
