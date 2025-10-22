import { ISecteurArborescence } from "./types";

export interface DureeBadgeProps {
  backgroundColor: string;
  color: string;
  label: string;
}

export const DUREE_SEUILS = {
  COURT: 30,
  MOYEN: 60,
  LONG: 90,
} as const;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function calculateJoursSansContrat(date?: string): number {
  if (!date) return 0;
  return Math.floor((Date.now() - new Date(date).getTime()) / MS_PER_DAY);
}

export function getDureeBadgeProps(days: number): DureeBadgeProps {
  if (days <= DUREE_SEUILS.COURT) {
    return { backgroundColor: "#FEF6E3", color: "#716043", label: `${days}j/90` };
  } else if (days <= DUREE_SEUILS.MOYEN) {
    return { backgroundColor: "#F99782", color: "#FEF4F2", label: `${days}j/90` };
  } else if (days <= DUREE_SEUILS.LONG) {
    return { backgroundColor: "#F95C5E", color: "#FFFFFF", label: `${days}j/90` };
  } else {
    return { backgroundColor: "#E6E6E6", color: "#3A3A3A", label: "+ de 3 mois" };
  }
}

export function mapSecteursFromFtData(
  ftData: Record<string, any>,
  secteurs: ISecteurArborescence[]
): Array<{ code: string; libelle: string }> {
  return Object.keys(ftData)
    .map((code) => {
      const secteur = secteurs.find((s) => s.code_secteur === Number(code));
      return secteur ? { code, libelle: secteur.libelle_secteur } : null;
    })
    .filter((s): s is { code: string; libelle: string } => s !== null);
}
