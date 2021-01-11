const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const Joi = require("joi");
const { UserEvent } = require("../../common/model/index");
const logger = require("../../common/logger");

const POST_STATUTS_CANDIDATS_MAX_INPUT_LENGTH = 100;

module.exports = ({ statutsCandidats }) => {
  const router = express.Router();

  /**
   * Schema for validation
   */
  const statutCandidatSchema = Joi.array()
    .max(POST_STATUTS_CANDIDATS_MAX_INPUT_LENGTH)
    .items(
      Joi.object({
        ine_apprenant: Joi.string().allow(null, ""),
        nom_apprenant: Joi.string().required(),
        prenom_apprenant: Joi.string().required(),
        prenom2_apprenant: Joi.string().allow(null, ""),
        prenom3_apprenant: Joi.string().allow(null, ""),
        ne_pas_solliciter: Joi.boolean().required(),
        email_contact: Joi.string().allow(null, ""),
        nom_representant_legal: Joi.string().allow(null, ""),
        tel_representant_legal: Joi.string().allow(null, ""),
        tel2_representant_legal: Joi.string().allow(null, ""),
        id_formation: Joi.string().required(),
        libelle_court_formation: Joi.string().allow(null, ""),
        libelle_long_formation: Joi.string().allow(null, ""),
        uai_etablissement: Joi.string().required(),
        siret_etablissement: Joi.string().required(),
        nom_etablissement: Joi.string().required(),
        statut_apprenant: Joi.number().required(),
        date_metier_mise_a_jour_statut: Joi.date().allow(null, ""),
      })
    );

  /**
   * Route post for Statuts Candidats
   */
  router.post(
    "/",
    tryCatch(async (req, res) => {
      try {
        // Validate schema
        await statutCandidatSchema.validateAsync(req.body, { abortEarly: false });

        // Add user event
        const event = new UserEvent({
          username: req.user.username,
          type: "POST",
          action: "statut-candidats",
          data: JSON.stringify(req.body),
        });
        await event.save();

        // Add StatutsCandidats
        const toAddOrUpdate = req.body.map((statutCandidat) => ({
          ...statutCandidat,
          source: req.user.username,
        }));
        await statutsCandidats.addOrUpdateStatuts(toAddOrUpdate);

        res.json({
          status: "OK",
          message: "Success",
        });
      } catch (err) {
        logger.error("POST StatutCandidat error : " + err);
        res.status(400).json({
          status: "ERROR",
          message: err.message,
        });
      }
    })
  );

  /**
   * Test route for Statuts Candidats
   */
  router.post(
    "/test",
    tryCatch(async (_req, res) => {
      return res.json({ msg: "ok" });
    })
  );

  return router;
};
