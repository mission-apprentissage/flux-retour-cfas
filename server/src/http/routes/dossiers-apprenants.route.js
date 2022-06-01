const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const Joi = require("joi");
const logger = require("../../common/logger");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { schema: anneeScolaireSchema } = require("../../common/domain/anneeScolaire");
const { CODES_STATUT_APPRENANT } = require("../../common/constants/dossierApprenantConstants");
const { cfdRegex } = require("../../common/domain/cfd");
const { uaiRegex } = require("../../common/domain/uai");
const { siretRegex } = require("../../common/domain/siret");

const validateRequestBody = require("../middlewares/validateRequestBody");
const validateRequestQuery = require("../middlewares/validateRequestQuery");
const { findAndPaginate } = require("../../common/utils/dbUtils");
const { sendJsonStream } = require("../../common/utils/httpUtils");
const { oleoduc, transformIntoJSON } = require("oleoduc");

const POST_DOSSIERS_APPRENANTS_MAX_INPUT_LENGTH = 100;

module.exports = ({ dossiersApprenants, userEvents, db }) => {
  const router = express.Router();

  /**
   * Schema for item validation
   */
  const dateSchema = Joi.string()
    .regex(/^([0-9]{4})-([0-9]{2})-([0-9]{2})/) // make sure the passed date contains at least YYYY-MM-DD
    .custom((val, helpers) => {
      const { value, error } = Joi.date().iso().validate(val);
      return error ? helpers.error("string.isoDate") : value;
    });

  const dossierApprenantItemSchema = Joi.object({
    // required fields
    nom_apprenant: Joi.string().required(),
    prenom_apprenant: Joi.string().required(),
    date_de_naissance_apprenant: dateSchema.required(),
    uai_etablissement: Joi.string().regex(uaiRegex).required(),
    nom_etablissement: Joi.string().required(),
    id_formation: Joi.string().regex(cfdRegex).required(),
    annee_scolaire: anneeScolaireSchema.required(),
    statut_apprenant: Joi.number()
      .valid(CODES_STATUT_APPRENANT.apprenti, CODES_STATUT_APPRENANT.inscrit, CODES_STATUT_APPRENANT.abandon)
      .required(),
    date_metier_mise_a_jour_statut: dateSchema.required(),

    // optional
    ine_apprenant: Joi.string().allow(null, ""),
    id_erp_apprenant: Joi.string().allow(null),
    email_contact: Joi.string().allow(null, ""),
    tel_apprenant: Joi.string().allow(null),
    code_commune_insee_apprenant: Joi.string().allow(null),

    siret_etablissement: Joi.string().regex(siretRegex).allow(null, ""),
    etablissement_formateur_geo_coordonnees: Joi.string().allow(null),
    etablissement_formateur_code_commune_insee: Joi.string().allow(null),

    libelle_court_formation: Joi.string().allow(null, ""),
    libelle_long_formation: Joi.string().allow(null, ""),
    periode_formation: Joi.string().allow(null, ""),
    annee_formation: Joi.number().allow(null),
    formation_rncp: Joi.string().allow(null, ""),

    contrat_date_debut: dateSchema.allow(null),
    contrat_date_fin: dateSchema.allow(null),
    contrat_date_rupture: dateSchema.allow(null),
    date_entree_formation: dateSchema.allow(null),
  });

  const commonDossiersApprenantsFilters = {
    etablissement_num_region: Joi.string().allow(null, ""),
    etablissement_num_departement: Joi.string().allow(null, ""),
    formation_cfd: Joi.string().allow(null, ""),
    uai_etablissement: Joi.string().allow(null, ""),
    siret_etablissement: Joi.string().allow(null, ""),
    annee_scolaire: Joi.string().allow(null, ""),
  };

  const buildPrettyValidationError = (joiError) => {
    return {
      dossierApprenantId: {
        nom_apprenant: joiError._original.nom_apprenant,
        prenom_apprenant: joiError._original.prenom_apprenant,
        date_de_naissance_apprenant: joiError._original.date_de_naissance_apprenant,
        formation_cfd: joiError._original.id_formation,
        uai_etablissement: joiError._original.uai_etablissement,
        annee_scolaire: joiError._original.annee_scolaire,
      },
      errors: joiError.details.map(({ message, path }) => {
        return { message, path: JSON.stringify(path) };
      }),
    };
  };

  /**
   * Route post for DossierApprenant
   */
  router.post(
    "/",
    validateRequestBody(Joi.array().max(POST_DOSSIERS_APPRENANTS_MAX_INPUT_LENGTH)),
    tryCatch(async (req, res) => {
      try {
        let nbItemsValid = 0;
        let validationErrors = [];
        let validDossiersApprenantToAddOrUpdate = [];

        // Add user event
        await userEvents.create({
          username: req.user.username,
          type: "POST",
          action: "statut-candidats",
          data: req.body,
        });

        // Validate items one by one
        await asyncForEach(req.body, async (currentDossierApprenant, index) => {
          const dossierApprenantValidation = dossierApprenantItemSchema.validate(currentDossierApprenant, {
            stripUnknown: true, // will remove keys that are not defined in schema, without throwing an error
            abortEarly: false, // make sure every invalid field will be communicated to the caller
          });

          if (dossierApprenantValidation.error) {
            const prettyValidationError = buildPrettyValidationError(dossierApprenantValidation.error);
            validationErrors.push(prettyValidationError);
            await db.collection("dossiersApprenantsApiErrors").insert({
              erp: req.user.username,
              created_at: new Date(),
              ...prettyValidationError,
            });
            logger.warn(`Could not validate item from ${req.user.username} at index ${index}`, prettyValidationError);
          } else {
            nbItemsValid++;
            // Build toAddOrUpdateList list
            validDossiersApprenantToAddOrUpdate.push({
              ...currentDossierApprenant,
              formation_cfd: currentDossierApprenant.id_formation,
              // periode_formation is sent as string "year1-year2" i.e. "2020-2022", we transform it to [2020-2022]
              periode_formation: currentDossierApprenant.periode_formation
                ? currentDossierApprenant.periode_formation.split("-").map(Number)
                : null,
              source: req.user.username,
            });
          }
        });

        // AddOrUpdate valid DossierApprenant
        await dossiersApprenants.addOrUpdateDossiersApprenants(validDossiersApprenantToAddOrUpdate);

        res.json({
          status: validationErrors.length > 0 ? `WARNING` : "OK",
          message: validationErrors.length > 0 ? `Warning : ${validationErrors.length} items not valid` : "Success",
          ok: nbItemsValid,
          ko: validationErrors.length,
          validationErrors,
        });
      } catch (err) {
        logger.error("POST /dossiers-apprenants error : " + err);
        res.status(400).json({
          status: "ERROR",
          message: err.message,
        });
      }
    })
  );

  /**
   * Route get for DossierApprenant
   */
  router.get(
    "/",
    validateRequestQuery(
      Joi.object({
        page: Joi.number(),
        limit: Joi.number(),
        ...commonDossiersApprenantsFilters,
      })
    ),
    tryCatch(async (req, res) => {
      const { page: reqPage, limit: reqLimit, ...filtersFromBody } = req.query;
      const page = Number(reqPage ?? 1);
      const limit = Number(reqLimit ?? 1000);

      try {
        // Add user event
        await userEvents.create({
          username: req.user.username,
          type: "GET",
          action: "dossier-apprenants",
          data: req.body,
        });

        // Gets paginated data filtered on source mapped to username
        const { find, pagination } = await findAndPaginate(
          db.collection("dossiersApprenants"),
          { ...filtersFromBody, source: req.user.username },
          { projection: { created_at: 0, updated_at: 0, _id: 0, __v: 0 }, page, limit: limit }
        );

        // Return JSON Stream
        return sendJsonStream(
          oleoduc(
            find.stream(),
            transformIntoJSON({
              arrayPropertyName: "dossiersApprenants",
              arrayWrapper: {
                pagination,
              },
            })
          ),
          res
        );
      } catch (err) {
        logger.error("GET DossierApprenants error : " + err);
        res.status(500).json({
          status: "ERROR",
          message: err.message,
        });
      }
    })
  );

  /**
   * Test route for dossiers-apprenants
   */
  router.post(
    "/test",
    tryCatch(async (_req, res) => {
      return res.json({ msg: "ok" });
    })
  );

  return router;
};
