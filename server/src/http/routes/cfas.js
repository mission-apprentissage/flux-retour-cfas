const express = require("express");
const Joi = require("joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { CfaModel, DossierApprenantModel } = require("../../common/model");
const validateRequestBody = require("../middlewares/validateRequestBody");

module.exports = ({ cfas, cfaDataFeedback }) => {
  const router = express.Router();

  router.post(
    "/search",
    validateRequestBody(
      Joi.object({
        searchTerm: Joi.string().min(3),
        etablissement_num_region: Joi.string().allow(null, ""),
        etablissement_num_departement: Joi.string().allow(null, ""),
        etablissement_reseaux: Joi.string().allow(null, ""),
      })
    ),
    tryCatch(async (req, res) => {
      const foundCfas = await cfas.searchCfas(req.body);
      return res.json(foundCfas);
    })
  );

  router.post(
    "/data-feedback",
    validateRequestBody(
      Joi.object({
        uai: Joi.string().required(),
        email: Joi.string().required(),
        details: Joi.string().required(),
      })
    ),
    tryCatch(async (req, res) => {
      const created = await cfaDataFeedback.createCfaDataFeedback(req.body);

      return res.json(created);
    })
  );

  /**
   * Gets the dashboard data for cfa
   */
  router.get(
    "/:uai",
    tryCatch(async (req, res) => {
      const { uai } = req.params;

      // Search cfa in DossierApprenant collection
      const cfaFound = await DossierApprenantModel.findOne({
        uai_etablissement: uai,
      }).lean();

      if (!cfaFound) {
        return res.status(404).json({ message: `No cfa found for uai ${uai}` });
      } else {
        // Search reseaux for cfa in référentiel
        const cfaInReferentiel = await CfaModel.findOne({ uai }).lean();
        const sousEtablissements = await cfas.getSousEtablissementsForUai(uai);

        // Build response
        return res.json({
          libelleLong: cfaFound.nom_etablissement,
          reseaux: cfaInReferentiel?.reseaux ?? [],
          domainesMetiers: cfaInReferentiel?.metiers ?? [],
          uai: cfaFound.uai_etablissement,
          sousEtablissements: sousEtablissements,
          adresse: cfaFound.etablissement_adresse,
          url_tdb: cfaInReferentiel ? cfaInReferentiel?.private_url : null,
        });
      }
    })
  );

  /**
   * Gets the uai for cfa by accessToken
   */
  router.get(
    "/url-access-token/:token",
    tryCatch(async (req, res) => {
      const { token } = req.params;

      const cfaFound = await cfas.getFromAccessToken(token);

      return cfaFound
        ? res.json({ uai: cfaFound.uai })
        : res.status(404).json({ message: `No cfa found for access_token ${token}` });
    })
  );

  return router;
};
