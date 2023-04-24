import { RequestHandler } from "express";
import { ObjectId } from "mongodb";

import {
  requireManageOrganismeEffectifsPermission,
  requireOrganismeIndicateursAccess,
} from "@/common/actions/helpers/permissions";

interface MyLocals {
  organismeId: ObjectId;
}

export function authOrgMiddleware<TParams = any, TQuery = any, TBody = any, TLocals = any>(
  type: "manager" | "reader"
): RequestHandler<TParams, any, TBody, TQuery, TLocals & MyLocals> {
  return (req, res, next) => {
    (type === "reader" ? requireOrganismeIndicateursAccess : requireManageOrganismeEffectifsPermission)(
      req.user,
      res.locals.organismeId
    )
      .then(() => next())
      .catch(next);
  };
}
