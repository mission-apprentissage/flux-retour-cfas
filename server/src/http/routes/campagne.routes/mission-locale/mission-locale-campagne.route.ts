import express from "express";

import { returnResult } from "@/http/middlewares/helpers";

export default () => {
  const router = express.Router();

  router.get("/", returnResult(getMissionLocaleEffectifInfoByToken));

  return router;
};

const getMissionLocaleEffectifInfoByToken = () => {
  return true;
};
