type ParamsUpdater = (updates: Record<string, string | undefined>) => void;

/**
 * Logique de tri + pagination partagée par les listes CFA (rupture, suivi ML, effectifs).
 * - handleSort : bascule asc/desc sur la même colonne, sinon repart en asc ; réinitialise la page.
 * - handlePageChange : met à jour la page (omise si page 1, pour une URL propre) + scroll en haut.
 */
export function useSortablePagination(sort: string, order: "asc" | "desc", onParamsChange: ParamsUpdater) {
  const handleSort = (sortKey: string) => {
    if (sort === sortKey) {
      onParamsChange({ order: order === "asc" ? "desc" : "asc", page: undefined });
    } else {
      onParamsChange({ sort: sortKey, order: "asc", page: undefined });
    }
  };

  const handlePageChange = (page: number) => {
    onParamsChange({ page: page > 1 ? String(page) : undefined });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return { handleSort, handlePageChange };
}
