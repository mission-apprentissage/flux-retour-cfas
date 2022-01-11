const express = require("express");
const Joi = require("joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { CfaModel, StatutCandidatModel } = require("../../common/model");
const pick = require("lodash.pick");

module.exports = ({ cfas, cfaDataFeedback }) => {
  const router = express.Router();

  const searchBodyValidationSchema = Joi.object({
    searchTerm: Joi.string().min(3),
    etablissement_num_region: Joi.string().allow(null, ""),
    etablissement_num_departement: Joi.string().allow(null, ""),
    etablissement_reseaux: Joi.string().allow(null, ""),
  });

  const dataFeedbackBodyValidationSchema = Joi.object({
    uai: Joi.string().required(),
    email: Joi.string().required(),
    details: Joi.string().required(),
  });

  router.post(
    "/search",
    tryCatch(async (req, res) => {
      const { error } = searchBodyValidationSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          status: "INPUT_VALIDATION_ERROR",
          message: error.message,
        });
      }

      const foundCfas = await cfas.searchCfas(req.body);
      return res.json(foundCfas);
    })
  );

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const { query, page, limit } = await Joi.object({
        query: Joi.string().default("{}"),
        page: Joi.number().default(1),
        limit: Joi.number().default(50),
      }).validateAsync(req.query, { abortEarly: false });

      const jsonQuery = JSON.parse(query);
      const allData = await CfaModel.paginate(jsonQuery, { page, limit });
      const omittedData = allData.docs.map((item) =>
        pick(item._doc, ["uai", "sirets", "nom", "reseaux", "region_nom", "region_num", "metiers"])
      );

      return res.json({
        cfas: omittedData,
        pagination: {
          page: allData.page,
          resultats_par_page: limit,
          nombre_de_page: allData.pages,
          total: allData.total,
        },
      });
    })
  );

  router.post(
    "/data-feedback",
    tryCatch(async (req, res) => {
      const { error } = dataFeedbackBodyValidationSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          status: "INPUT_VALIDATION_ERROR",
          message: error.message,
        });
      }

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

      // Search cfa in statuts
      const cfaFound = await StatutCandidatModel.findOne({
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
