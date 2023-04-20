import { ObjectId } from "mongodb";
import { NextFunction, Request, Response } from "express";

import { requireManageOrganismeEffectifsPermission } from "../../common/actions/helpers/permissions.js";

export async function legacyRequireManageEffectifsPermissionMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    await requireManageOrganismeEffectifsPermission(
      req.user,
      (req.query.organisme_id as any as ObjectId) || (req.body.organisme_id as any as ObjectId)
    );
    next();
  } catch (err) {
    next(err);
  }
}
