import express from "express";
import Joi from "joi";
import { validateFullObjectSchema } from "../../../../common/utils/validationUtils.js";
import { returnResult } from "../../../middlewares/helpers.js";

const formationsSearchSchema = {
  searchTerm: Joi.string().min(3),
  etablissement_num_region: Joi.string().allow(null, ""),
  etablissement_num_departement: Joi.string().allow(null, ""),
  etablissement_reseaux: Joi.string().allow(null, ""),
};

export default ({ formations }) => {
  const router = express.Router();

  router.post(
    "/search",
    returnResult(async (req) => {
      const formationSearch = await validateFullObjectSchema(req.body, formationsSearchSchema);
      return await formations.searchFormations(formationSearch);
    })
  );

  router.get(
    "/:cfd",
    returnResult(async (req) => {
      return formations.getFormationWithCfd(req.params.cfd);
    })
  );

  return router;
};
