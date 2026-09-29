import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { ORGANISATION_TYPE } from "shared/constants/organisations";
import { REGIONS_BY_CODE, REGIONS_WITH_SVG_SORTED } from "shared/constants/territoires";
import { zStatsPeriod, type StatsPeriod } from "shared/models/data/nationalStats.model";

import { useAuth } from "@/app/_context/UserContext";

import { useUserRegions } from "./useUserRegions";

export const TERRITOIRE_FRANCE = "france";
export const STATS_FILTER_PARAMS = ["periode", "territoire"] as const;

const DEFAULT_PERIOD: StatsPeriod = "30days";
const ADMIN_REGION_CODES = REGIONS_WITH_SVG_SORTED.map((region) => region.code);

export interface TerritoireOption {
  value: string;
  label: string;
}

export function getRegionLabel(code: string) {
  return REGIONS_BY_CODE[code as keyof typeof REGIONS_BY_CODE]?.nom ?? code;
}

export function useStatsFilters() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { regions: ownRegions, isLoading } = useUserRegions();

  const isAdmin = user?.organisation?.type === ORGANISATION_TYPE.ADMINISTRATEUR;
  const allowedRegions = isAdmin ? ADMIN_REGION_CODES : ownRegions;
  const defaultTerritoire = !isAdmin && ownRegions.length === 1 ? ownRegions[0] : TERRITOIRE_FRANCE;

  const territoireOptions = useMemo<TerritoireOption[]>(
    () => [
      { value: TERRITOIRE_FRANCE, label: "France" },
      ...allowedRegions.map((code) => ({ value: code, label: getRegionLabel(code) })),
    ],
    [allowedRegions]
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
