import express from "express";

import { getCollaborationExportData } from "@/common/actions/admin/collaborations/collaboration-export.actions";
import { getCollaborationStats } from "@/common/actions/admin/collaborations/collaboration-stats.actions";
import { returnResult } from "@/http/middlewares/helpers";

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

  return router;
};
