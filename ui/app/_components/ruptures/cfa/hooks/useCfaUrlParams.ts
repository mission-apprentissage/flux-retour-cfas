import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * Query params d'URL des listes CFA : lecture (searchParams) + mise à jour (updateParams)
 * via router.push sans scroll. Une valeur falsy (undefined / "") supprime le param ;
 * un query vide retombe sur basePath sans "?".
 */
export function useCfaUrlParams(basePath: string) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      const qs = params.toString();
      router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
    },
    [searchParams, router, basePath]
  );

  return { searchParams, updateParams };
}
