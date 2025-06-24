import express from "express";

import { getMissionsLocalesByArml } from "@/common/actions/mission-locale/arml.actions";
import { returnResult } from "@/http/middlewares/helpers";

export default () => {
  const router = express.Router();
  router.get("/mls", returnResult(getMissionLocales));
  return router;
};

const getMissionLocales = async (_req, { locals }) => {
  const arml = locals.arml;
  return getMissionsLocalesByArml(arml._id);
};
