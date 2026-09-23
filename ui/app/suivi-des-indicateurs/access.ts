import { ORGANISATION_TYPE } from "shared/constants/organisations";

import type { AuthContext } from "@/common/internal/AuthContext";

const INDICATEURS_ORGANISATION_TYPES: ReadonlyArray<string> = [
  ORGANISATION_TYPE.ARML,
  ORGANISATION_TYPE.DREETS,
  ORGANISATION_TYPE.DDETS,
  ORGANISATION_TYPE.ADMINISTRATEUR,
];

/** Utilisateur connecté ayant accès aux pages national, région et Mission Locale du suivi des indicateurs. */
export function isIndicateursUser(user: AuthContext | null): boolean {
  return !!user && INDICATEURS_ORGANISATION_TYPES.includes(user.organisation?.type ?? "");
}

export function isAdminUser(user: AuthContext | null): boolean {
  return user?.organisation?.type === ORGANISATION_TYPE.ADMINISTRATEUR;
}

export const ADMIN_DEFAULT_REGION_CODE = "84";
