import express from "express";

import { reseauxDb } from "@/common/model/collections";
import { returnResult } from "@/http/middlewares/helpers";

export default () => {
  const router = express.Router();

  router.get("/", returnResult(getAllReseaux));

  return router;
};

const getAllReseaux = async () => {
  return reseauxDb()
    .find({}, { projection: { _id: 1, nom: 1, key: 1, responsable: 1 } })
    .sort({ nom: 1 })
    .toArray();
};
