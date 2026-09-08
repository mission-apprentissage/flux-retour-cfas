import { ML_TRI_COLONNE } from "shared/constants";

export type MlTriEtat = { colonne: ML_TRI_COLONNE; ordre: "asc" | "desc" };

/** Suffixe de query partagé par la liste, les liens vers la fiche et son précédent/suivant. */
export const triEnQuery = (tri?: MlTriEtat | null) => (tri ? `&tri=${tri.colonne}&ordre=${tri.ordre}` : "");

/**
 * Clic sur un en-tête : ascendant, puis descendant, puis retour à l'ordre de priorité du serveur —
 * qui est le cœur de ces listes, le conseiller doit pouvoir y revenir.
 */
export const triSuivant = (tri: MlTriEtat | null, colonne: ML_TRI_COLONNE): MlTriEtat | null => {
  if (tri?.colonne !== colonne) return { colonne, ordre: "asc" };
  return tri.ordre === "asc" ? { colonne, ordre: "desc" } : null;
};
