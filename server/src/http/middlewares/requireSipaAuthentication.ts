import * as Sentry from "@sentry/node";
import Boom from "boom";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { sipaUsersDb } from "@/common/model/collections";
import config from "@/config";

export default function requireSipaAuthentication() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization;
      if (!header?.startsWith("Bearer ")) return next(Boom.unauthorized("Token manquant"));
      if (!config.auth.sipa.jwtSecret) return next(Boom.unauthorized("Token invalide ou expiré"));

      let decoded: any;
      try {
        decoded = jwt.verify(header.slice(7), config.auth.sipa.jwtSecret, {
          issuer: config.appName,
          algorithms: ["HS256"],
        });
      } catch {
        return next(Boom.unauthorized("Token invalide ou expiré"));
      }
      if (decoded.scope !== "sipa") return next(Boom.forbidden("Scope invalide"));

      const user = await sipaUsersDb().findOne({ username: decoded.sub });
      if (!user) return next(Boom.unauthorized("Token invalide ou expiré"));
      (req.user as any) = { _id: user._id, username: user.username };
      Sentry.setUser({
        segment: "sipa",
        ip_address: req.ip,
        id: user._id.toString(),
        username: user.username,
      });
      next();
    } catch (err) {
      next(err);
    }
  };
}
