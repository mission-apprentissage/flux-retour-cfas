const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const Joi = require("joi");
const { StatutCandidat } = require("../../common/model/index");
const logger = require("../../common/logger");

module.exports = () => {
  const router = express.Router();

  /**
   * Schema for validation
   */
  const statutCandidatSchema = Joi.object({
    ine_apprenant: Joi.string().required(),
    nom_apprenant: Joi.string().required(),
    prenom_apprenant: Joi.string().required(),
    prenom2_apprenant: Joi.string(),
    prenom3_apprenant: Joi.string(),
    ne_pas_solliciter: Joi.boolean().required(),
    email_contact: Joi.string().required(),
    nom_representant_legal: Joi.string().required(),
    tel_representant_legal: Joi.string().required(),
    tel2_representant_legal: Joi.string(),
    id_formation_souhait: Joi.string().required(),
    libelle_court_formation_souhait: Joi.string().required(),
    libelle_long_formation_souhait: Joi.string().required(),
    uai_etablissement_origine: Joi.string().required(),
    nom_etablissement_origine: Joi.string().required(),
    statut_apprenant: Joi.number().required(),
    date_entree_statut: Joi.date().required(),
    date_saisie_statut: Joi.date().required(),
    date_mise_a_jour_statut: Joi.date().required(),
  });

  router.post(
    "/",
    tryCatch(async (req, res) => {
      await statutCandidatSchema.validateAsync(req.body, { abortEarly: false });

      const item = req.body;
      logger.info("Posting new items : ", item);

      const sampleToAdd = new StatutCandidat({
        ine_apprenant: req.body.ine_apprenant,
        nom_apprenant: req.body.nom_apprenant,
        prenom_apprenant: req.body.prenom_apprenant,
        prenom2_apprenant: req.body.prenom2_apprenant,
        prenom3_apprenant: req.body.prenom3_apprenant,
        ne_pas_solliciter: req.body.ne_pas_solliciter,
        email_contact: req.body.email_contact,
        nom_representant_legal: req.body.nom_representant_legal,
        tel_representant_legal: req.body.tel_representant_legal,
        tel2_representant_legal: req.body.tel2_representant_legal,
        id_formation_souhait: req.body.id_formation_souhait,
        libelle_court_formation_souhait: req.body.libelle_court_formation_souhait,
        libelle_long_formation_souhait: req.body.libelle_long_formation_souhait,
        uai_etablissement_origine: req.body.uai_etablissement_origine,
        nom_etablissement_origine: req.body.nom_etablissement_origine,
        statut_apprenant: req.body.statut_apprenant,
        date_entree_statut: req.body.date_entree_statut,
        date_saisie_statut: req.body.date_saisie_statut,
        date_mise_a_jour_statut: req.body.date_mise_a_jour_statut,
      });

      await sampleToAdd.save();

      // return updated list
      res.json(sampleToAdd);

      return res.json({
        message: "Statut Candidats Secured route for user : " + req.user.username,
      });
    })
  );

  return router;
};
