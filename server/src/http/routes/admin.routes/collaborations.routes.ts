import express from "express";
import { zCfaInvitesSansCollabQuery } from "shared/models/routes/admin/cfa-invites-sans-collab.api";
import { z } from "zod";

import { getCfaInvitesSansCollab } from "@/common/actions/admin/collaborations/cfa-invites-sans-collab.actions";
import { getCollaborationExportData } from "@/common/actions/admin/collaborations/collaboration-export.actions";
import { getCollaborationStats } from "@/common/actions/admin/collaborations/collaboration-stats.actions";
import { DefaultParams, returnResult, RouteHandler } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

type AdminHandler<TQuery> = RouteHandler<Record<string, unknown>, DefaultParams, TQuery>;

export default () => {
  const router = express.Router();

  router.get(
    "/stats",
    returnResult(async () => getCollaborationStats())
  );

  router.get(
    "/export",
    returnResult(async () => getCollaborationExportData())
  );

  router.get(
    "/cfa-invites-sans-collab",
    validateRequestMiddleware({ query: zCfaInvitesSansCollabQuery }),
    returnResult(getCfaInvitesSansCollabRoute)
  );

  return router;
};

const getCfaInvitesSansCollabRoute: AdminHandler<z.infer<typeof zCfaInvitesSansCollabQuery>> = async (req) => {
  return await getCfaInvitesSansCollab(req.query);
};
