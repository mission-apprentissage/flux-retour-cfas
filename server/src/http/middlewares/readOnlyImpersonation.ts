import * as Boom from "@hapi/boom";
import type { NextFunction, Request, Response } from "express";

import type { AuthContext } from "@/common/model/internal/AuthContext";

const ID = "[0-9a-f]{24}";

/**
 * Routes de lecture accessibles pendant une imposture en lecture seule (DREETS, DDETS, ARML). Toute autre requête est
 * refusée : une nouvelle route doit être ajoutée ici explicitement pour être visible en imposture.
 */
export const READ_ONLY_IMPERSONATION_ALLOWED_GET: RegExp[] = [
  /^\/api\/v1\/session$/,
  /^\/api\/v1\/(erps|organisation\/organisme)$/,
  // Espace CFA : liste et détail des effectifs, suivi des collaborations (les exports restent exclus)
  new RegExp(
    `^/api/v1/organismes/${ID}/cfa/(effectifs|effectifs-ruptures|suivi-mission-locale|unread-notifications-count|effectif/${ID})$`
  ),
  new RegExp(`^/api/v1/organismes/${ID}/mission-locale/(effectifs-per-month|effectif/${ID})$`),
  // Espace Mission Locale : dossiers, compteurs, paramètres (l'export des dossiers reste exclu)
  new RegExp(
    `^/api/v1/organisation/mission-locale/(effectifs|compteurs-onglets|effectifs-per-month|villes|parametres|banner-stats|cfa-invitations|effectif/${ID})$`
  ),
];

const isAllowed = (method: string, path: string) => {
  if (method === "DELETE" && path === "/api/v1/admin/impersonate") return true;
  return method === "GET" && READ_ONLY_IMPERSONATION_ALLOWED_GET.some((pattern) => pattern.test(path));
};

export function restrictReadOnlyImpersonation(req: Request, _res: Response, next: NextFunction) {
  const user = req.user as AuthContext | undefined;
  if (user?.readOnly && !isAllowed(req.method, req.path)) {
    throw Boom.forbidden("Cette imposture est en lecture seule");
  }
  next();
}
