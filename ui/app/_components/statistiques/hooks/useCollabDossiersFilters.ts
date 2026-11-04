import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

const PREFIX = "collab_";
const LIST_KEYS = ["departements", "statuts", "delais", "cfa", "ml", "situations", "motifs", "resultats"] as const;
type ListKey = (typeof LIST_KEYS)[number];

export type CollabDossiersFilters = Partial<Record<ListKey, string[]>> & { debut?: string; fin?: string };

/** Filtres de la liste des collaborations, conservés dans l'URL avec un préfixe propre à l'onglet. */
export function useCollabDossiersFilters() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const query = searchParams?.toString() ?? "";

  const filters = useMemo<CollabDossiersFilters>(() => {
    const params = new URLSearchParams(query);
    const result: CollabDossiersFilters = {};
    LIST_KEYS.forEach((key) => {
      const values = params.get(`${PREFIX}${key}`)?.split(",").filter(Boolean);
      if (values?.length) result[key] = values;
    });
    const debut = params.get(`${PREFIX}debut`);
    const fin = params.get(`${PREFIX}fin`);
    if (debut) result.debut = debut;
    if (fin) result.fin = fin;
    return result;
  }, [query]);

  const update = useCallback(
    (changes: Partial<Record<ListKey | "debut" | "fin", string | undefined>>) => {
      const params = new URLSearchParams(query);
      Object.entries(changes).forEach(([key, value]) =>
        value ? params.set(`${PREFIX}${key}`, value) : params.delete(`${PREFIX}${key}`)
      );
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, query]
  );

  return {
    filters,
    setList: (key: ListKey, values: string[]) => update({ [key]: values.length ? values.join(",") : undefined }),
    setPeriode: ({ debut, fin }: { debut?: string; fin?: string }) => update({ debut, fin }),
  };
}
