import Boom from "boom";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { sipaUsersDb } from "@/common/model/collections";
import config from "@/config";

export default function requireSipaAuthentication() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization;
      if (!header?.startsWith("Bearer ")) throw Boom.unauthorized("Token manquant");
      if (!config.auth.sipa.jwtSecret) throw Boom.unauthorized("Token invalide ou expiré");
      const decoded: any = jwt.verify(header.slice(7), config.auth.sipa.jwtSecret, {
        issuer: config.appName,
        algorithms: ["HS256"],
      });
      if (decoded.scope !== "sipa") throw Boom.forbidden("Scope invalide");
      const user = await sipaUsersDb().findOne({ username: decoded.sub });
      if (!user) throw Boom.unauthorized("Token invalide ou expiré");
      next();
    } catch (err: any) {
      if (Boom.isBoom(err)) return next(err);
      next(Boom.unauthorized("Token invalide ou expiré"));
    }
  };
}
