import express from "express";
import { zEmailStatusEnum } from "shared/models";
import { z } from "zod";

import {
  getMissionLocaleRupturantToCheckMail,
  updateRupturantsWithMailInfo,
} from "@/common/actions/mission-locale/mission-locale.actions";
import { returnResult } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

export default () => {
  const router = express.Router();

  router.get("/rupturants", returnResult(getRupturants));
  router.put(
    "/rupturants",
    validateRequestMiddleware({
      body: z.object({
        rupturants: z.array(
          z.object({
            email: z.string(),
            status: zEmailStatusEnum,
          })
        ),
      }),
    }),
    returnResult(updateRupturants)
  );
  return router;
};

const getRupturants = async () => {
  return await getMissionLocaleRupturantToCheckMail();
};

const updateRupturants = async (req) => {
  const { body } = req;
  const { rupturants } = body;
  return await updateRupturantsWithMailInfo(rupturants);
};
