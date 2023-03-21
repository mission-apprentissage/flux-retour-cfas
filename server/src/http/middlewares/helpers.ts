import Boom from "boom";
import { Request } from "express";

import { USER_ACCOUNT_STATUS } from "../../common/constants/usersConstants.js";

// catch errors and return the result of the request handler
export function returnResult(serviceFunc) {
  return async (req, res, next) => {
    const result = await serviceFunc(req, res, next);
    res.set("Content-Type", "application/json");
    res.send(result);
  };
}

// would be simpler to put this helper function into the cache structure
export async function tryCachedExecution(cache, cacheKey, serviceFunc) {
  const cachedResult = await cache.get(cacheKey);
  if (cachedResult) {
    return JSON.parse(cachedResult);
  } else {
    const result = await serviceFunc();
    await cache.set(cacheKey, JSON.stringify(result));
    return result;
  }
}

export function indicateursPermissions() {
  return async (req, _, next) => {
    ensureValidUser(req.user);
    next();
  };
}

// helpers
export function ensureValidUser(user) {
  if (user.account_status !== USER_ACCOUNT_STATUS.CONFIRMED) {
    throw Boom.forbidden("Accès non autorisé");
  }
}

export function requireAdministrator(req: Request) {
  ensureValidUser(req.user);
  if (req.user.organisation.type !== "ADMINISTRATEUR") {
    throw Boom.forbidden("Accès non autorisé");
  }
}
