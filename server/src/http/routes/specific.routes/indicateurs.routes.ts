import { legacyEffectifsFiltersSchema } from "../../../common/actions/helpers/filters.js";
import express from "express";
import { getNbDistinctOrganismes } from "../../../common/actions/effectifs.actions.js";
import {
  getEffectifsCountByAnneeFormationAtDate,
  getEffectifsCountByCfaAtDate,
  getEffectifsCountByDepartementAtDate,
  getEffectifsCountByFormationAtDate,
  getEffectifsCountByNiveauFormationAtDate,
  getEffectifsCountBySiretAtDate,
  getIndicateurs,
} from "../../../common/actions/effectifs/effectifs.actions.js";
import { validateFullZodObjectSchema } from "../../../common/utils/validationUtils.js";
import { returnResult } from "../../middlewares/helpers.js";

export default () => {
  const router = express.Router();

  /**
   * Gets nb organismes formation
   */
  router.get(
    "/total-organismes",
    returnResult(async (req) => {
      const filters = await validateFullZodObjectSchema(req.query, legacyEffectifsFiltersSchema);
      return {
        nbOrganismes: await getNbDistinctOrganismes(req.user, filters),
      };
    })
  );

  /**
   * Gets the effectifs count for input period & query
   */
  router.get(
    "/",
    returnResult(async (req) => {
      const filters = await validateFullZodObjectSchema(req.query, legacyEffectifsFiltersSchema);
      return await getIndicateurs(req.user, filters);
    })
  );

  /**
   * Get effectifs details by niveau_formation
   */
  router.get(
    "/niveau-formation",
    returnResult(async (req) => {
      const filters = await validateFullZodObjectSchema(req.query, legacyEffectifsFiltersSchema);
      return await getEffectifsCountByNiveauFormationAtDate(req.user, filters);
    })
  );

  /**
   * Get effectifs details by formation_cfd
   */
  router.get(
    "/formation",
    returnResult(async (req) => {
      const filters = await validateFullZodObjectSchema(req.query, legacyEffectifsFiltersSchema);
      return await getEffectifsCountByFormationAtDate(req.user, filters);
    })
  );

  /**
   * Get effectifs details by annee_formation
   */
  router.get(
    "/annee-formation",
    returnResult(async (req) => {
      const filters = await validateFullZodObjectSchema(req.query, legacyEffectifsFiltersSchema);
      return await getEffectifsCountByAnneeFormationAtDate(req.user, filters);
    })
  );

  /**
   * Get effectifs details by cfa
   */
  router.get(
    "/cfa",
    returnResult(async (req) => {
      const filters = await validateFullZodObjectSchema(req.query, legacyEffectifsFiltersSchema);
      return await getEffectifsCountByCfaAtDate(req.user, filters);
    })
  );

  /**
   * Get effectifs details by siret
   */
  router.get(
    "/siret",
    returnResult(async (req) => {
      const filters = await validateFullZodObjectSchema(req.query, legacyEffectifsFiltersSchema);
      return await getEffectifsCountBySiretAtDate(req.user, filters);
    })
  );

  /**
   * Get effectifs details by departement
   */
  router.get(
    "/departement",
    returnResult(async (req) => {
      const filters = await validateFullZodObjectSchema(req.query, legacyEffectifsFiltersSchema);
      return await getEffectifsCountByDepartementAtDate(req.user, filters);
    })
  );

  return router;
};
