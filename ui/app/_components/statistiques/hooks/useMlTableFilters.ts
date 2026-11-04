import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import type { TraitementMLFilters } from "../tables/TraitementMLTable";

const parseBoolean = (value: string | null | undefined) =>
  value === "true" ? true : value === "false" ? false : undefined;

/** Filtres du tableau « Suivi traitement par Missions Locales », conservés dans l'URL. */
export function useMlTableFilters() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();

  const departementsParam = searchParams?.get("departements") ?? "";
  const utiliseServiceParam = searchParams?.get("utilise_service");
  const engageeParam = searchParams?.get("engagee");

  const filters = useMemo<TraitementMLFilters>(
    () => ({
      departements: departementsParam ? departementsParam.split(",").filter(Boolean) : undefined,
      utiliseService: parseBoolean(utiliseServiceParam),
      engagee: parseBoolean(engageeParam),
    }),
    [departementsParam, utiliseServiceParam, engageeParam]
  );

  const update = useCallback(
    (changes: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams?.toString());
      Object.entries(changes).forEach(([key, value]) => (value ? params.set(key, value) : params.delete(key)));
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  return {
    filters,
    setDepartements: (codes: string[]) => update({ departements: codes.length ? codes.join(",") : undefined }),
    setUtiliseService: (value: boolean | undefined) =>
      update({ utilise_service: value === undefined ? undefined : String(value) }),
    setEngagee: (value: boolean | undefined) => update({ engagee: value === undefined ? undefined : String(value) }),
  };
}
