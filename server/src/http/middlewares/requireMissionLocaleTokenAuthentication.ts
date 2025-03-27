import { NextFunction, Response } from "express";
import { missionLocaleEffectifsDb } from "@/common/model/collections";
import Boom from "boom";

export default function requireMissionLocaleTokenAuthentication() {
  return async (req: any, res: Response, next: NextFunction) => {

    try {

      const token = req.params.id;
      const eff = missionLocaleEffectifsDb().findOne({ "brevo.token": token })
  
      if(!eff) {
        throw Boom.forbidden("Token invalide");
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
