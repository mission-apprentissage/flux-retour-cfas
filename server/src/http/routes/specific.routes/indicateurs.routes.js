import express from "express";
import Joi from "joi";
import { getNbDistinctOrganismes } from "../../../common/actions/dossiersApprenants.actions.js";
import { validateFullObjectSchema } from "../../../common/utils/validationUtils.js";
import { returnResult } from "../../middlewares/helpers.js";

const commonEffectifsFiltersSchema = {
  date: Joi.date().required(),
  organisme_id: Joi.string().allow(null, ""),
  formation_cfd: Joi.string().allow(null, ""),
  etablissement_reseaux: Joi.string().allow(null, ""),
  etablissement_num_departement: Joi.string().allow(null, ""),
  etablissement_num_region: Joi.string().allow(null, ""),
  niveau_formation: Joi.string().allow(null, ""),
  // FIXME peut-être à gérer
  // siret_etablissement: Joi.string().allow(null, ""),
  // uai_etablissement: Joi.string().allow(null, ""),
};

/**
 * Build filters from the request
 * @param {*} req
 * @returns {Promise<import("../../../common/components/filters.js").EffectifsFilters>}
 */
async function buildEffectifsFiltersFromRequest(req) {
  /** @type {import("../../../common/components/filters.js").EffectifsFilters} */
  const filters = await validateFullObjectSchema(req.query, commonEffectifsFiltersSchema);

  // restriction aux organismes de l'utilisateur si pas de filtre par organisme
  if (filters.organisme_id === undefined) {
    filters.organisme_ids = req.user.organisme_ids;
  }
  return filters;
}

export default ({ effectifs }) => {
  const router = express.Router();

  /**
   * Gets nb organismes formation
   */
  router.get(
    "/total-organismes",
    returnResult(async (req) => {
      const filters = await buildEffectifsFiltersFromRequest(req);
      const nbOrganismes = await getNbDistinctOrganismes(filters); // FIXME: fetch from effectifs collection?
      return {
        nbOrganismes,
      };
    })
  );

  /**
   * Gets the effectifs count for input period & query
   */
  router.get(
    "/",
    returnResult(async (req) => {
      const filters = await buildEffectifsFiltersFromRequest(req);
      return await effectifs.getIndicateurs(filters);
    })
  );

  /**
   * Get effectifs details by niveau_formation
   */
  router.get(
    "/niveau-formation",
    returnResult(async (req) => {
      const filters = await buildEffectifsFiltersFromRequest(req);
      return await effectifs.getEffectifsCountByNiveauFormationAtDate(filters);
    })
  );

  /**
   * Get effectifs details by formation_cfd
   */
  router.get(
    "/formation",
    returnResult(async (req) => {
      const filters = await buildEffectifsFiltersFromRequest(req);
      return await effectifs.getEffectifsCountByFormationAtDate(filters);
    })
  );

  /**
   * Get effectifs details by annee_formation
   */
  router.get(
    "/annee-formation",
    returnResult(async (req) => {
      const filters = await buildEffectifsFiltersFromRequest(req);
      return await effectifs.getEffectifsCountByAnneeFormationAtDate(filters);
    })
  );

  /**
   * Get effectifs details by cfa
   */
  router.get(
    "/cfa",
    returnResult(async (req) => {
      const filters = await buildEffectifsFiltersFromRequest(req);
      return await effectifs.getEffectifsCountByCfaAtDate(filters);
    })
  );

  /**
   * Get effectifs details by siret
   */
  router.get(
    "/siret",
    returnResult(async (req) => {
      const filters = await buildEffectifsFiltersFromRequest(req);
      // console.log('organismes', filters.)
      return await effectifs.getEffectifsCountBySiretAtDate(filters);
    })
  );

  /**
   * Get effectifs details by departement
   */
  router.get(
    "/departement",
    returnResult(async (req) => {
      const filters = await buildEffectifsFiltersFromRequest(req);
      return await effectifs.getEffectifsCountByDepartementAtDate(filters);
    })
  );

  return router;
};
