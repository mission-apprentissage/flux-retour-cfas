import Boom from "boom";
import { ObjectId } from "bson";
import express from "express";
import { zDeclareCfaRuptureApi } from "shared/models/routes/organismes/cfa";
import { z } from "zod";

import { getCfaEffectifsEnRupture } from "@/common/actions/cfa/cfa-effectifs-ruptures.actions";
import {
  declareCfaEffectifRupture,
  getCfaEffectifDetail,
  getCfaEffectifs,
} from "@/common/actions/cfa/cfa-effectifs.actions";
import { getOrganisationOrganismeByOrganismeId } from "@/common/actions/organisations.actions";
import { organismesDb } from "@/common/model/collections";
import { validateFullZodObjectSchema } from "@/common/utils/validationUtils";
import { returnResult } from "@/http/middlewares/helpers";

const zCfaEffectifsQuery = {
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sort: z.enum(["nom", "formation", "date_rupture", "en_rupture", "collab_status"]).default("nom"),
  order: z.enum(["asc", "desc"]).default("asc"),
  en_rupture: z.enum(["oui", "non"]).optional(),
  collab_status: z.string().optional(),
  formation: z.string().optional(),
};

const zDeclareRuptureBody = zDeclareCfaRuptureApi.shape;

async function getOrganismeWithDeca(locals: { organismeId: string }) {
  const organismeObjectId = new ObjectId(locals.organismeId);
  const organisme = await getOrganisationOrganismeByOrganismeId(organismeObjectId);
  if (!organisme) {
    throw Boom.notFound("No organisme found for the provided ID");
  }
  if (organisme.type !== "ORGANISME_FORMATION") {
    throw Boom.forbidden("This endpoint is only available for CFA organisations");
  }
  if (!organisme.organisme_id) {
    throw Boom.badData("Organisation has no organisme_id");
  }

  const organismeId = new ObjectId(organisme.organisme_id);

  const organismeDoc = await organismesDb().findOne({ _id: organismeId }, { projection: { is_allowed_deca: 1 } });

  return { organisme, organismeId, isAllowedDeca: organismeDoc?.is_allowed_deca ?? false };
}

async function getCfaEffectifsRuptureHandler(_req, { locals }) {
  const { organisme, isAllowedDeca } = await getOrganismeWithDeca(locals);
  return await getCfaEffectifsEnRupture(organisme, isAllowedDeca);
}

export default () => {
  const router = express.Router();

  router.get("/effectifs-ruptures", returnResult(getCfaEffectifsRuptureHandler));

  router.get(
    "/effectifs",
    returnResult(async ({ query }, { locals }) => {
      const { organisme, isAllowedDeca } = await getOrganismeWithDeca(locals);
      const params = await validateFullZodObjectSchema(query, zCfaEffectifsQuery);
      return await getCfaEffectifs(organisme, isAllowedDeca, params);
    })
  );

  router.get(
    "/effectif/:id",
    returnResult(async (req, { locals }) => {
      if (!ObjectId.isValid(req.params.id)) {
        throw Boom.badRequest("ID effectif invalide");
      }
      const { organismeId } = await getOrganismeWithDeca(locals);
      const userId = req.user?._id ? new ObjectId(req.user._id) : undefined;
      return await getCfaEffectifDetail(organismeId, req.params.id, userId);
    })
  );

  router.post(
    "/effectif/:id/declare-rupture",
    returnResult(async (req, { locals }) => {
      if (!ObjectId.isValid(req.params.id)) {
        throw Boom.badRequest("ID effectif invalide");
      }
      const { organismeId } = await getOrganismeWithDeca(locals);
      const { date_rupture, source } = await validateFullZodObjectSchema(req.body, zDeclareRuptureBody);
      const userId = req.user?._id ? new ObjectId(req.user._id) : undefined;
      if (!userId) {
        throw Boom.unauthorized("Utilisateur non authentifié");
      }
      return await declareCfaEffectifRupture(organismeId, req.params.id, source, new Date(date_rupture), userId);
    })
  );

  return router;
};
