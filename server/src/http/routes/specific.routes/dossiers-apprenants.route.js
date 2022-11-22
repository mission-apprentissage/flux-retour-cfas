import express from "express";
import tryCatch from "../../middlewares/tryCatchMiddleware.js";
import Joi from "joi";
import logger from "../../../common/logger.js";
import { asyncForEach } from "../../../common/utils/asyncUtils.js";
import { schema as anneeScolaireSchema } from "../../../common/domain/anneeScolaire.js";
import { schema as ISO8601DateSchema } from "../../../common/domain/date.js";
import { schema as statutApprenantSchema } from "../../../common/domain/apprenant/statutApprenant.js";
import { schema as uaiSchema } from "../../../common/domain/uai.js";
import { schema as cfdSchema } from "../../../common/domain/cfd.js";
import { schema as nomApprenantSchema } from "../../../common/domain/apprenant/nomApprenant.js";
import { schema as prenomApprenantSchema } from "../../../common/domain/apprenant/prenomApprenant.js";
import { schema as siretSchema } from "../../../common/domain/siret.js";
import { findAndPaginate } from "../../../common/utils/dbUtils.js";
import { USER_EVENTS_ACTIONS, USER_EVENTS_TYPES } from "../../../common/constants/userEventsConstants.js";
import { dossiersApprenantsDb, dossiersApprenantsApiErrorsDb } from "../../../common/model/collections.js";
import { sendTransformedPaginatedJsonStream } from "../../../common/utils/httpUtils.js";

const POST_DOSSIERS_APPRENANTS_MAX_INPUT_LENGTH = 100;

export default ({ dossiersApprenants, userEvents }) => {
  const router = express.Router();

  /**
   * Schema for item validation
   */

  const dossierApprenantItemSchema = Joi.object({
    // required fields
    nom_apprenant: nomApprenantSchema.required(),
    prenom_apprenant: prenomApprenantSchema.required(),
    date_de_naissance_apprenant: ISO8601DateSchema.required(),
    uai_etablissement: uaiSchema.required(),
    nom_etablissement: Joi.string().required(),
    id_formation: cfdSchema.required(),
    annee_scolaire: anneeScolaireSchema.required(),
    statut_apprenant: statutApprenantSchema.required(),
    date_metier_mise_a_jour_statut: ISO8601DateSchema.required(),

    // optional
    ine_apprenant: Joi.string().allow(null, ""),
    id_erp_apprenant: Joi.string().allow(null),
    email_contact: Joi.string().allow(null, ""),
    tel_apprenant: Joi.string().allow(null, ""),
    code_commune_insee_apprenant: Joi.string().allow(null),

    siret_etablissement: siretSchema.allow(null, ""),

    libelle_long_formation: Joi.string().allow(null, ""),
    periode_formation: Joi.string().allow(null, ""),
    annee_formation: Joi.number().allow(null),
    formation_rncp: Joi.string().allow(null, ""),

    contrat_date_debut: ISO8601DateSchema.allow(null),
    contrat_date_fin: ISO8601DateSchema.allow(null),
    contrat_date_rupture: ISO8601DateSchema.allow(null),
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
    tryCatch(async ({ user, body }, res) => {
      const dataIn = await Joi.array()
        .max(POST_DOSSIERS_APPRENANTS_MAX_INPUT_LENGTH)
        .validateAsync(body, { abortEarly: false });

      try {
        let nbItemsValid = 0;
        let validationErrors = [];
        let validDossiersApprenantToAddOrUpdate = [];

        // Add user event
        await userEvents.create({
          username: user.username,
          type: USER_EVENTS_TYPES.POST,
          action: USER_EVENTS_ACTIONS.DOSSIER_APPRENANT,
          data: dataIn,
        });

        // Validate items one by one
        await asyncForEach(dataIn, async (currentDossierApprenant, index) => {
          const dossierApprenantValidation = dossierApprenantItemSchema.validate(currentDossierApprenant, {
            stripUnknown: true, // will remove keys that are not defined in schema, without throwing an error
            abortEarly: false, // make sure every invalid field will be communicated to the caller
          });

          if (dossierApprenantValidation.error) {
            const prettyValidationError = buildPrettyValidationError(dossierApprenantValidation.error);
            validationErrors.push(prettyValidationError);
            await dossiersApprenantsApiErrorsDb().insert({
              erp: user.username,
              created_at: new Date(),
              ...prettyValidationError,
            });
            logger.warn(`Could not validate item from ${user.username} at index ${index}`, prettyValidationError);
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
              source: user.username,
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
    tryCatch(async (req, res) => {
      const {
        page: reqPage,
        limit: reqLimit,
        ...filtersFromBody
      } = await Joi.object({
        page: Joi.number(),
        limit: Joi.number(),
        ...commonDossiersApprenantsFilters,
      }).validateAsync(req.query, { abortEarly: false });

      const page = Number(reqPage ?? 1);
      const limit = Number(reqLimit ?? 1000);

      try {
        // Add user event
        await userEvents.create({
          username: req.user.username,
          type: USER_EVENTS_TYPES.GET,
          action: USER_EVENTS_ACTIONS.DOSSIER_APPRENANT,
          data: req.body,
        });

        // Gets paginated data filtered on source mapped to username
        const { find, pagination } = await findAndPaginate(
          dossiersApprenantsDb(),
          { ...filtersFromBody, source: req.user.username },
          { projection: { created_at: 0, updated_at: 0, _id: 0, __v: 0 }, page, limit: limit }
        );

        // Return JSON transformed Stream
        return sendTransformedPaginatedJsonStream(find.stream(), "dossiersApprenants", pagination, res);
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
