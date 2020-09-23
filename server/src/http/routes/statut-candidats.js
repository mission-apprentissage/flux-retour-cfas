const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const Joi = require("joi");
const config = require("config");
const { StatutCandidat, UserEvent } = require("../../common/model/index");
const logger = require("../../common/logger");
const { asyncForEach } = require("../../common/utils/asyncUtils");

module.exports = () => {
  const router = express.Router();

  /**
   * Schema for validation
   */
  const statutCandidatSchema = Joi.array()
    .max(config.postStatutsCandidatsMaxLength)
    .items(
      Joi.object({
        ine_apprenant: Joi.string().required(),
        nom_apprenant: Joi.string().required(),
        prenom_apprenant: Joi.string().required(),
        prenom2_apprenant: Joi.string(),
        prenom3_apprenant: Joi.string(),
        ne_pas_solliciter: Joi.boolean().required(),
        email_contact: Joi.string().required(),
        nom_representant_legal: Joi.string(),
        tel_representant_legal: Joi.string(),
        tel2_representant_legal: Joi.string(),
        id_formation_souhait: Joi.string().required(),
        libelle_court_formation_souhait: Joi.string(),
        libelle_long_formation_souhait: Joi.string(),
        uai_etablissement_origine: Joi.string().required(),
        nom_etablissement_origine: Joi.string().required(),
        statut_apprenant: Joi.number().required(),
      })
    );

  router.post(
    "/",
    tryCatch(async (req, res) => {
      await statutCandidatSchema.validateAsync(req.body, { abortEarly: false });

      logger.info("Posting new statut candidats : ", req.body);
      const event = new UserEvent({
        username: req.user.username,
        type: "POST",
        action: "statut-candidats",
        data: JSON.stringify(req.body),
      });
      await event.save();

      const toAdd = [];
      await asyncForEach(req.body, async (item) => {
        toAdd.push(
          new StatutCandidat({
            ine_apprenant: item.ine_apprenant,
            nom_apprenant: item.nom_apprenant,
            prenom_apprenant: item.prenom_apprenant,
            prenom2_apprenant: item.prenom2_apprenant,
            prenom3_apprenant: item.prenom3_apprenant,
            ne_pas_solliciter: item.ne_pas_solliciter,
            email_contact: item.email_contact,
            nom_representant_legal: item.nom_representant_legal,
            tel_representant_legal: item.tel_representant_legal,
            tel2_representant_legal: item.tel2_representant_legal,
            id_formation_souhait: item.id_formation_souhait,
            libelle_court_formation_souhait: item.libelle_court_formation_souhait,
            libelle_long_formation_souhait: item.libelle_long_formation_souhait,
            uai_etablissement_origine: item.uai_etablissement_origine,
            nom_etablissement_origine: item.nom_etablissement_origine,
            statut_apprenant: item.statut_apprenant,
            date_entree_statut: item.date_entree_statut,
            date_saisie_statut: item.date_saisie_statut,
            date_mise_a_jour_statut: item.date_mise_a_jour_statut,
          })
        );
      });

      await StatutCandidat.insertMany(toAdd);
      return res.json(toAdd);
    })
  );

  return router;
};
