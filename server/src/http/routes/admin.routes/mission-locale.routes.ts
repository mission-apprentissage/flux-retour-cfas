import express from "express";
import { z } from "zod";

import { activateMissionLocale } from "@/common/actions/admin/mission-locale/mission-locale.admin.actions";
import { returnResult } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

export default () => {
  const router = express.Router();

  router.post(
    "/activate",
    validateRequestMiddleware({
      body: z.object({ date: z.date(), missionLocaleId: z.string() }),
    }),
    returnResult(activateMLAtDate)
  );

  return router;
};

const activateMLAtDate = ({ body }) => {
  const { date, missionLocaleId } = body;
  return activateMissionLocale(missionLocaleId, date);
};
