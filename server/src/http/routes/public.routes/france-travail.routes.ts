import express from "express";

import { getAllFranceTravail } from "@/common/actions/organisations.actions";
import { returnResult } from "@/http/middlewares/helpers";

export default () => {
  const router = express.Router();

  router.get("/", returnResult(getAllFranceTravailOrganisations));

  return router;
};

const getAllFranceTravailOrganisations = async () => {
  return await getAllFranceTravail();
};
