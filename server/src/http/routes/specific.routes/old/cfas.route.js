import express from "express";
import Joi from "joi";
import tryCatch from "../../../middlewares/tryCatchMiddleware.js";
import { returnResult } from "../../../middlewares/helpers.js";
import { uaiSchema, validateFullObjectSchema } from "../../../../common/utils/validationUtils.js";
import {
  findOrganismeByUai,
  getSousEtablissementsForUai,
  searchOrganismes,
} from "../../../../common/actions/organismes/organismes.actions.js";

const organismeSearchSchema = {
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
      const search = await validateFullObjectSchema(req.body, organismeSearchSchema);
      return await searchOrganismes(search);
    })
  );

  /**
   * Gets the dashboard data for cfa
   */
  const getByUaiSchema = {
    uai: uaiSchema(),
  };
  router.get(
    "/:uai",
    tryCatch(async (req, res) => {
      const { uai } = await validateFullObjectSchema(req.params, getByUaiSchema);
      const organisme = await findOrganismeByUai(uai);
      if (!organisme) {
        return res.status(404).json({ message: `No cfa found for UAI ${uai}` });
      }

      const sousEtablissements = await getSousEtablissementsForUai(uai);
      return res.json({
        libelleLong: organisme.nom,
        reseaux: organisme.reseaux,
        domainesMetiers: organisme.metiers,
        uai: organisme.uai,
        nature: organisme.nature,
        nature_validity_warning: organisme.nature_validity_warning,
        adresse: organisme.adresse,
        sousEtablissements,
      });
    })
  );

  return router;
};
