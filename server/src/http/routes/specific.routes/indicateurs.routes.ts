import Joi from "joi";
import { EffectifsFilters, EffectifsFiltersWithRestriction } from "../../../common/actions/helpers/filters.js";
import express from "express";
import { Request } from "express-serve-static-core";
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
import { validateFullObjectSchemaUnknown } from "../../../common/utils/validationUtils.js";
import { returnResult } from "../../middlewares/helpers.js";
import {
  getEffectifsRestriction,
  requireOrganismeIndicateursAccess,
} from "../../../common/actions/helpers/permissions.js";
import { organismesDb } from "../../../common/model/collections.js";
import Boom from "boom";

const commonEffectifsFiltersSchema = {
  date: Joi.date().required(),
  organisme_id: Joi.string().allow(null, ""),
  formation_cfd: Joi.string().allow(null, ""),
  etablissement_reseaux: Joi.string().allow(null, ""),
  etablissement_num_departement: Joi.string().allow(null, ""),
  etablissement_num_region: Joi.string().allow(null, ""),
  niveau_formation: Joi.string().allow(null, ""),
  siret_etablissement: Joi.string().allow(null, ""),
  uai_etablissement: Joi.string().allow(null, ""),
};

/**
 * Build filters from the request
 */
export async function buildEffectifsFiltersFromRequest(req: Request): Promise<EffectifsFiltersWithRestriction> {
  const filters: EffectifsFiltersWithRestriction = await validateFullObjectSchemaUnknown<EffectifsFilters>(
    req.query,
    commonEffectifsFiltersSchema
  );

  // ce helper est principalement appelé dans les routes des indicateurs agrégés et non scopés à un organisme, mais aussi pour un organisme :
  // - si uai ou siret, indicateurs pour un organisme, on vérifie que l'organisation y a accès
  // - si pas d'organisme_id, indicateurs agrégés, restriction classique
  // TODO il faudra sortir organisme_id (et uai / siret) pour le spécifier dans une autre route /organismes/:id/indicateurs
  // pour que les indicateurs ici ne soit que ceux agrégés
  if (filters.uai_etablissement) {
    // comme on a pas l'organisme_id on doit retrouver l'organisme via uai
    const organisme = await organismesDb()
      .find({
        uai: filters.uai_etablissement,
      })
      .next();
    if (!organisme) {
      throw Boom.notFound("Organisme non trouvé");
    }
    await requireOrganismeIndicateursAccess(req.user, organisme._id.toString());
  } else if (filters.siret_etablissement) {
    // comme on a pas l'organisme_id on doit retrouver l'organisme via siret
    const organisme = await organismesDb()
      .find({
        siret: filters.siret_etablissement,
      })
      .next();
    if (!organisme) {
      throw Boom.notFound("Organisme non trouvé");
    }
    await requireOrganismeIndicateursAccess(req.user, organisme._id.toString());
  } else {
    // amend filters with a restriction
    filters.restrictionMongo = await getEffectifsRestriction(req.user);
  }

  return filters;
}

export default () => {
  const router = express.Router();

  /**
   * Gets nb organismes formation
   */
  router.get(
    "/total-organismes",
    returnResult(async (req) => {
      const filters = await buildEffectifsFiltersFromRequest(req);
      return {
        nbOrganismes: await getNbDistinctOrganismes(filters),
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
      return await getIndicateurs(filters);
    })
  );

  /**
   * Get effectifs details by niveau_formation
   */
  router.get(
    "/niveau-formation",
    returnResult(async (req) => {
      const filters = await buildEffectifsFiltersFromRequest(req);
      return await getEffectifsCountByNiveauFormationAtDate(filters);
    })
  );

  /**
   * Get effectifs details by formation_cfd
   */
  router.get(
    "/formation",
    returnResult(async (req) => {
      const filters = await buildEffectifsFiltersFromRequest(req);
      return await getEffectifsCountByFormationAtDate(filters);
    })
  );

  /**
   * Get effectifs details by annee_formation
   */
  router.get(
    "/annee-formation",
    returnResult(async (req) => {
      const filters = await buildEffectifsFiltersFromRequest(req);
      return await getEffectifsCountByAnneeFormationAtDate(filters);
    })
  );

  /**
   * Get effectifs details by cfa
   */
  router.get(
    "/cfa",
    returnResult(async (req) => {
      const filters = await buildEffectifsFiltersFromRequest(req);
      return await getEffectifsCountByCfaAtDate(filters);
    })
  );

  /**
   * Get effectifs details by siret
   */
  router.get(
    "/siret",
    returnResult(async (req) => {
      const filters = await buildEffectifsFiltersFromRequest(req);
      return await getEffectifsCountBySiretAtDate(filters);
    })
  );

  /**
   * Get effectifs details by departement
   */
  router.get(
    "/departement",
    returnResult(async (req) => {
      const filters = await buildEffectifsFiltersFromRequest(req);
      return await getEffectifsCountByDepartementAtDate(filters);
    })
  );

  return router;
};
