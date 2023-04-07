import { requireManageOrganismeEffectifsPermission } from "../../common/actions/helpers/permissions.js";
import { NextFunction, Request, Response } from "express";

export async function legacyRequireManageEffectifsPermissionMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    await requireManageOrganismeEffectifsPermission(
      req.user,
      (req.query.organisme_id as string) || (req.body.organisme_id as string)
    );
    next();
  } catch (err) {
    next(err);
  }
}
