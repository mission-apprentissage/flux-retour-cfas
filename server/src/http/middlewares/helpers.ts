import { AuthContext } from "@/src/common/model/internal/AuthContext.js";
import Boom from "boom";
import { NextFunction, Request, Response } from "express";

import { USER_ACCOUNT_STATUS } from "../../common/constants/usersConstants.js";

type Handler = (req: Request, res: Response, next: NextFunction) => any | Promise<any>;

// catch errors and return the result of the request handler
export function returnResult(serviceFunc: Handler) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const result = await serviceFunc(req, res, next);
    res.set("Content-Type", "application/json");
    res.send(
      result ?? {
        message: "success",
      }
    );
  };
}

export function indicateursPermissions() {
  return async (req, _, next) => {
    ensureValidUser(req.user);
    next();
  };
}

// helpers
export function ensureValidUser(user: AuthContext) {
  if (user.account_status !== USER_ACCOUNT_STATUS.CONFIRMED) {
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
