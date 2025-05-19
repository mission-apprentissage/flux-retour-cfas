import express from "express";
import { z } from "zod";

import { getMissionsLocales } from "@/common/apis/apiAlternance/apiAlternance";
import { getLbaTrainingLinks, LBA_URL } from "@/common/apis/lba/lba.api";
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
    const lbaResponse = await getLbaTrainingLinks(cfd, rncp);

    let lbaUrl: string = `${LBA_URL}/recherche-emploi`;

    if (lbaResponse && lbaResponse.data && lbaResponse.data.length) {
      lbaUrl = lbaResponse.data[0].lien_lba as string;
    }

    const url = new URL(lbaUrl);
    url.searchParams.set("utm_source", utm_source);
    url.searchParams.set("utm_medium", utm_medium);
    url.searchParams.set("utm_campaign", utm_campaign);
    lbaUrl = url.toString();

    res.redirect(302, lbaUrl);
  } catch (error) {
    next(error);
  }
};
