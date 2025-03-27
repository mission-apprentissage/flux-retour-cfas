import Boom from "boom";
import { NextFunction, Response } from "express";

import { missionLocaleEffectifsDb } from "@/common/model/collections";

export default function requireMissionLocaleTokenAuthentication() {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const token = req.params.id;
      const eff = await missionLocaleEffectifsDb().findOne({ "brevo.token": token });
      if (!eff) {
        throw Boom.forbidden("Token invalide");
      }

      res.locals.token = token;

      next();
    } catch (err) {
      next(err);
    }
  };
}
