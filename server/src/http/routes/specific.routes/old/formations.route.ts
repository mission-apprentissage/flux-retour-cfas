import express from "express";
import Joi from "joi";
import { getFormationWithCfd, searchFormations } from "../../../../common/actions/formations.actions";
import { validateFullObjectSchema } from "../../../../common/utils/validationUtils";
import { returnResult } from "../../../middlewares/helpers";

const formationsSearchSchema = {
  searchTerm: Joi.string().min(3),
  etablissement_num_region: Joi.string().allow(null, ""),
  etablissement_num_departement: Joi.string().allow(null, ""),
  etablissement_reseaux: Joi.string().allow(null, ""),
};

export default () => {
  const router = express.Router();

  router.post(
    "/search",
    returnResult(async (req) => {
      const formationSearch = await validateFullObjectSchema(req.body, formationsSearchSchema);
      return await searchFormations(formationSearch);
    })
  );

  router.get(
    "/:cfd",
    returnResult(async (req) => {
      return await getFormationWithCfd(req.params.cfd);
    })
  );

  return router;
};
