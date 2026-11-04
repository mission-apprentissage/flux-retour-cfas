import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

const parseBoolean = (value: string | null | undefined) =>
  value === "true" ? true : value === "false" ? false : undefined;
const parseList = (value: string | null | undefined) => (value ? value.split(",").filter(Boolean) : undefined);

export interface CfaTableFilters {
  departements?: string[];
  natures?: string[];
  utilisateur?: boolean;
  qualiopi?: boolean;
  collabActive?: boolean;
}

/** Filtres de la liste « Les établissements de formation du territoire », conservés dans l'URL. */
export function useCfaTableFilters() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();

  const departementsParam = searchParams?.get("departements");
  const naturesParam = searchParams?.get("natures");
  const utilisateurParam = searchParams?.get("utilisateur");
  const qualiopiParam = searchParams?.get("qualiopi");
  const collabActiveParam = searchParams?.get("collab_active");

  const filters = useMemo<CfaTableFilters>(
    () => ({
      departements: parseList(departementsParam),
      natures: parseList(naturesParam),
      utilisateur: parseBoolean(utilisateurParam),
      qualiopi: parseBoolean(qualiopiParam),
      collabActive: parseBoolean(collabActiveParam),
    }),
    [departementsParam, naturesParam, utilisateurParam, qualiopiParam, collabActiveParam]
  );

  const update = useCallback(
    (changes: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams?.toString());
      Object.entries(changes).forEach(([key, value]) => (value ? params.set(key, value) : params.delete(key)));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const toParam = (value: boolean | undefined) => (value === undefined ? undefined : String(value));
  const toListParam = (values: string[]) => (values.length ? values.join(",") : undefined);

  return {
    filters,
    setDepartements: (codes: string[]) => update({ departements: toListParam(codes) }),
    setNatures: (natures: string[]) => update({ natures: toListParam(natures) }),
    setUtilisateur: (value: boolean | undefined) => update({ utilisateur: toParam(value) }),
    setQualiopi: (value: boolean | undefined) => update({ qualiopi: toParam(value) }),
    setCollabActive: (value: boolean | undefined) => update({ collab_active: toParam(value) }),
  };
}
