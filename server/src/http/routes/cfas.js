const express = require("express");
const Joi = require("joi");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const { Cfa, StatutCandidat } = require("../../common/model");

module.exports = ({ cfas, cfaDataFeedback }) => {
  const router = express.Router();

  const searchBodyValidationSchema = Joi.object({
    searchTerm: Joi.string().min(3),
    etablissement_num_region: Joi.string().allow(null, ""),
    etablissement_num_departement: Joi.string().allow(null, ""),
  }).min(1);

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
      const allData = await Cfa.paginate(jsonQuery, { page, limit });

      return res.json({
        cfas: allData.docs,
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
      const cfaFound = await StatutCandidat.findOne({
        uai_etablissement: uai,
      }).lean();

      if (!cfaFound) {
        return res.status(404).json({ message: `No cfa found for uai ${uai}` });
      } else {
        // Search reseaux for cfa in référentiel
        const cfaInReferentiel = await Cfa.findOne({ uai }).lean();
        const sousEtablissements = await cfas.getSousEtablissementsForUai(uai);

        // Build response
        return res.json({
          libelleLong: cfaFound.nom_etablissement,
          reseaux: cfaInReferentiel?.reseaux ?? [],
          domainesMetiers: cfaInReferentiel?.metiers ?? [],
          uai: cfaFound.uai_etablissement,
          sousEtablissements: sousEtablissements,
          adresse: cfaFound.etablissement_adresse,
        });
      }
    })
  );

  return router;
};
