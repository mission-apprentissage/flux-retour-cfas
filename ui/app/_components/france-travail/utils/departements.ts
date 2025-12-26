import { DEPARTEMENTS } from "shared/constants";

export interface DepartementOption {
  value: string;
  label: string;
}

export function getDepartementsByRegion(codeRegion: string): DepartementOption[] {
  return DEPARTEMENTS.filter((dept) => dept.region.code === codeRegion)
    .map((dept) => ({
      value: dept.code,
      label: `${dept.code} - ${dept.nom}`,
    }))
    .sort((a, b) => a.value.localeCompare(b.value));
}
