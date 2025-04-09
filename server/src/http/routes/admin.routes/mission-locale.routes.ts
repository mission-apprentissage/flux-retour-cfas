import { ObjectId } from "bson";
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
      body: z.object({ date: z.coerce.date(), missionLocaleId: z.string() }),
    }),
    returnResult(activateMLAtDate)
  );

  return router;
};

const activateMLAtDate = ({ body }) => {
  const { date, missionLocaleId } = body;
  return activateMissionLocale(new ObjectId(missionLocaleId), date);
};
