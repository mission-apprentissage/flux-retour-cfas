import * as Boom from "@hapi/boom";
import type { NextFunction, Request, Response } from "express";

import type { AuthContext } from "@/common/model/internal/AuthContext";

/**
 * Routes de lecture accessibles pendant une imposture en lecture seule (DREETS, DDETS, ARML). Toute autre requête est
 * refusée : une nouvelle route doit être ajoutée ici explicitement pour être visible en imposture.
 */
export const READ_ONLY_IMPERSONATION_ALLOWED_GET: RegExp[] = [/^\/api\/v1\/session$/];

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
