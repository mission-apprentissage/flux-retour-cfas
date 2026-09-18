import { ORGANISATION_TYPE } from "shared";

import type { AuthContext } from "@/common/internal/AuthContext";

const INDICATEURS_ORGANISATION_TYPES: ReadonlyArray<string> = [
  ORGANISATION_TYPE.ARML,
  ORGANISATION_TYPE.DREETS,
  ORGANISATION_TYPE.DDETS,
];

/** Utilisateur connecté ayant accès aux pages territoriales du suivi des indicateurs. */
export function isIndicateursUser(user: AuthContext | null): boolean {
  return !!user && INDICATEURS_ORGANISATION_TYPES.includes(user.organisation?.type ?? "");
}
