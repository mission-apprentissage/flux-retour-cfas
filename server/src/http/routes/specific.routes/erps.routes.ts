import express from "express";

import { findAllERP } from "@/common/actions/erp.actions";
import { returnResult } from "@/http/middlewares/helpers";

export default () => {
  const router = express.Router();

  router.get("/", returnResult(getErp));

  return router;
};

const getErp = async () => {
  return await findAllERP();
};
