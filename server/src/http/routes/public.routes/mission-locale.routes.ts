import express from "express";
import { z } from "zod";

import { getLbaTrainingLinksWithCustomUtm } from "@/common/actions/lba/lba.actions";
import { getMissionsLocales } from "@/common/apis/apiAlternance/apiAlternance";
import { returnResult } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

export default () => {
  const router = express.Router();

  router.get("/", returnResult(getAllMissionsLocales));
  router.get(
    "/lba",
    validateRequestMiddleware({
      query: z.object({
        utm_source: z.string(),
        utm_medium: z.string(),
        utm_campaign: z.string(),
        rncp: z.string().optional(),
        cfd: z.string().optional(),
      }),
    }),
    getLbaLink
  );
  return router;
};

const getAllMissionsLocales = async () => {
  return await getMissionsLocales();
};

const getLbaLink = async (req, res, next) => {
  try {
    const { utm_campaign, utm_medium, utm_source, rncp, cfd } = req.query;
    const lbaUrl = await getLbaTrainingLinksWithCustomUtm(cfd, rncp, {
      source: utm_source,
      medium: utm_medium,
      campaign: utm_campaign,
    });

    res.redirect(302, lbaUrl);
  } catch (error) {
    next(error);
  }
};
