import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { ORGANISATION_TYPE } from "shared/constants";
import { DEPARTEMENTS, DEPARTEMENTS_BY_CODE } from "shared/constants/territoires";
import { zStatsPeriod, type StatsPeriod } from "shared/models/data/nationalStats.model";

import { useAuth } from "@/app/_context/UserContext";
import { isAdminUser, TOUTES_REGIONS_CODES } from "@/app/suivi-des-indicateurs/access";

import { getRegionLabel } from "../utils";

import { useUserRegions } from "./useUserRegions";

export const TERRITOIRE_FRANCE = "france";
export const STATS_FILTER_PARAMS = ["periode", "territoire", "departement"] as const;

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
  const ownDepartement =
    user?.organisation?.type === ORGANISATION_TYPE.DDETS
      ? (user.organisation as { code_departement?: string }).code_departement
      : undefined;

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
  const territoireDemande =
    !!requestedTerritoire && territoireOptions.some((option) => option.value === requestedTerritoire);
  const territoire = territoireDemande ? requestedTerritoire : defaultTerritoire;
  const region = territoire === TERRITOIRE_FRANCE ? undefined : territoire;

  const departementOptions = useMemo<TerritoireOption[]>(
    () =>
      region
        ? DEPARTEMENTS.filter((d) => d.region.code === region).map((d) => ({
            value: d.code,
            label: `${d.nom} (${d.code})`,
          }))
        : [],
    [region]
  );
  // Une DDETS arrive sur son département ; un territoire choisi dans l'URL ne garde que le département de l'URL.
  const requestedDepartement = searchParams?.get("departement") ?? (territoireDemande ? undefined : ownDepartement);
  const departement = departementOptions.some((option) => option.value === requestedDepartement)
    ? requestedDepartement
    : undefined;

  const setParams = useCallback(
    (values: Partial<Record<(typeof STATS_FILTER_PARAMS)[number], string | null>>) => {
      const params = new URLSearchParams(searchParams?.toString());
      Object.entries(values).forEach(([key, value]) => (value ? params.set(key, value) : params.delete(key)));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const departementLabel = departement
    ? `${DEPARTEMENTS_BY_CODE[departement as keyof typeof DEPARTEMENTS_BY_CODE]?.nom} (${departement})`
    : undefined;

  return {
    period,
    territoire,
    territoireLabel: departementLabel ?? (region ? getRegionLabel(region) : "France"),
    regionLabel: region ? getRegionLabel(region) : "France",
    territoireOptions,
    region,
    departement,
    departementOptions,
    /** Paramètres de périmètre attendus par les routes territoriales `indicateurs-ml`. */
    scope: departement ? { region, departement } : region ? { region } : { national: true as const },
    isLoading,
    setPeriod: (value: StatsPeriod) => setParams({ periode: value }),
    setTerritoire: (value: string) => setParams({ territoire: value, departement: null }),
    // Le territoire est écrit dans l'URL : « tous les départements » ne retombe pas sur celui de la DDETS.
    setDepartement: (value: string | null) => setParams({ territoire, departement: value }),
  };
}
