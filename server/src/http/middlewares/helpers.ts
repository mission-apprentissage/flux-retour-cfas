import Boom from "boom";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { ObjectId } from "mongodb";
import { PermissionOrganisme } from "shared/constants/permissions";

import { hasOrganismePermission } from "@/common/actions/helpers/permissions-organisme";
import { AuthContext } from "@/common/model/internal/AuthContext";

// catch errors and return the result of the request handler
export function returnResult<TParams = any, TQuery = any, TBody = any, TLocals extends Record<string, any> = any>(
  serviceFunc: RequestHandler<TParams, any, TBody, TQuery, TLocals>
): RequestHandler<TParams, any, TBody, TQuery, TLocals> {
  return async (req, res, next) => {
    const result = (await serviceFunc(req, res, next)) as any;
    // le résultat est à renvoyer en JSON par défaut
    if (!res.getHeader("Content-Type")) {
      res.set("Content-Type", "application/json");
    }
    res.send(
      result ?? {
        message: "success",
      }
    );
  };
}

// helpers
export function ensureValidUser(user: AuthContext) {
  if (user.account_status !== "CONFIRMED") {
    throw Boom.forbidden("Accès non autorisé");
  }
}

export function requireAdministrator(req: Request, _res: Response, next: NextFunction) {
  ensureValidUser(req.user);
  if (req.user.organisation.type !== "ADMINISTRATEUR") {
    throw Boom.forbidden("Accès non autorisé");
  }
  next();
}

interface MyLocals {
  organismeId: ObjectId;
}

export function requireOrganismePermission<TParams = any, TQuery = any, TBody = any, TLocals = any>(
  permission: PermissionOrganisme
): RequestHandler<TParams, any, TBody, TQuery, TLocals & MyLocals> {
  return async (req, res, next) => {
    try {
      if (!(await hasOrganismePermission(req.user, res.locals.organismeId, permission))) {
        throw Boom.forbidden("Permissions invalides");
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
