import Boom from "boom";
import { ObjectId } from "bson";
import express from "express";

import { getMissionLocaleStatsById, getMissionsLocalesByArml } from "@/common/actions/mission-locale/arml.actions";
import { returnResult } from "@/http/middlewares/helpers";

export default () => {
  const router = express.Router();
  router.get("/mls", returnResult(getMissionLocales));
  router.get("/mls/:mlId", returnResult(getMissionLocale));
  return router;
};

const getMissionLocales = async (_req, { locals }) => {
  const arml = locals.arml;
  const mlList = await getMissionsLocalesByArml(arml._id);
  return { arml, mlList };
};

const getMissionLocale = async ({ params }, { locals }) => {
  const mlId = params.mlId;
  const ml = await getMissionLocaleStatsById(new ObjectId(mlId));

  if (!ml) {
    throw Boom.notFound("Mission locale not found");
  }

  if (ml.arml_id.toString() !== locals.arml._id.toString()) {
    throw Boom.forbidden("Mission locale does not belong to this ARML");
  }

  return ml;
};
