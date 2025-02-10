import express from "express";

import { getMissionsLocales } from "@/common/apis/apiAlternance/apiAlternance";
import { returnResult } from "@/http/middlewares/helpers";

export default () => {
  const router = express.Router();

  router.get("/", returnResult(getAllMissionsLocales));
  return router;
};

const getAllMissionsLocales = async () => {
  return await getMissionsLocales();
};
