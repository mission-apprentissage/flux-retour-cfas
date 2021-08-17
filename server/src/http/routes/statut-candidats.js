const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const Joi = require("joi");
const { UserEvent } = require("../../common/model/index");
const logger = require("../../common/logger");
const { asyncForEach } = require("../../common/utils/asyncUtils");

const POST_STATUTS_CANDIDATS_MAX_INPUT_LENGTH = 100;

module.exports = ({ statutsCandidats }) => {
  const router = express.Router();

  /**
   * Schema for list validation
   */
  const statutsCandidatListSchema = Joi.array().max(POST_STATUTS_CANDIDATS_MAX_INPUT_LENGTH);

  /**
   * Schema for item validation
   */
  const statutCandidatItemSchema = Joi.object({
    // required fields
    nom_apprenant: Joi.string().required(),
    prenom_apprenant: Joi.string().required(),
    ne_pas_solliciter: Joi.boolean().required(),
    uai_etablissement: Joi.string().required(),
    nom_etablissement: Joi.string().required(),
    statut_apprenant: Joi.number().required(),
    id_formation: Joi.string().required(),
    annee_scolaire: Joi.string().allow("", null),

    // optional
    ine_apprenant: Joi.string().allow(null, ""),
    prenom2_apprenant: Joi.string().allow(null, ""),
    prenom3_apprenant: Joi.string().allow(null, ""),
    email_contact: Joi.string().allow(null, ""),
    libelle_court_formation: Joi.string().allow(null, ""),
    libelle_long_formation: Joi.string().allow(null, ""),
    siret_etablissement: Joi.string().allow(null, ""),
    date_metier_mise_a_jour_statut: Joi.date().allow(null, ""),
    periode_formation: Joi.string().allow(null, ""),
    annee_formation: Joi.number().allow(null),

    // TODO remove when ERPs stop sending us this information
    nom_representant_legal: Joi.string().allow(null, ""),
    tel_representant_legal: Joi.string().allow(null, ""),
    tel2_representant_legal: Joi.string().allow(null, ""),
  });

  /**
   * Route post for Statuts Candidats
   */
  router.post(
    "/",
    tryCatch(async (req, res) => {
      try {
        let nbItemsValid = 0;
        let nbItemsInvalid = 0;
        let validationErrors = [];
        let validStatutsToAddOrUpdate = [];

        // Validate list
        await statutsCandidatListSchema.validateAsync(req.body, { abortEarly: false });

        // Add user event
        const event = new UserEvent({
          username: req.user.username,
          type: "POST",
          action: "statut-candidats",
          data: req.body,
        });
        await event.save();

        // Validate items one by one
        await asyncForEach(req.body, (currentStatutToAddOrUpdate) => {
          const statutValidation = statutCandidatItemSchema.validate(currentStatutToAddOrUpdate);

          if (statutValidation.error) {
            nbItemsInvalid++;
            validationErrors.push(statutValidation.error);
          } else {
            nbItemsValid++;
            // Build toAddOrUpdateList list
            validStatutsToAddOrUpdate.push({
              ...currentStatutToAddOrUpdate,
              formation_cfd: currentStatutToAddOrUpdate.id_formation,
              // periode_formation is sent as string "year1-year2" i.e. "2020-2022", we transform it to [2020-2022]
              periode_formation: currentStatutToAddOrUpdate.periode_formation
                ? currentStatutToAddOrUpdate.periode_formation.split("-").map(Number)
                : null,
              source: req.user.username,
            });
          }
        });

        // AddOrUpdate valid statuts
        await statutsCandidats.addOrUpdateStatuts(validStatutsToAddOrUpdate);

        res.json({
          status: validationErrors.length > 0 ? `ERROR` : "OK",
          message: validationErrors.length > 0 ? `Error : ${nbItemsInvalid} items not valid` : "Success",
          ok: nbItemsValid,
          ko: nbItemsInvalid,
          validationErrors,
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
