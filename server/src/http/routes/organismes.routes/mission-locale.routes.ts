import Boom from "boom";
import { ObjectId } from "bson";
import express from "express";
import { API_EFFECTIF_LISTE } from "shared/models";
import { zUpdateMissionLocaleEffectifOrganisme } from "shared/models/routes/organismes/mission-locale/missions-locale.api";
import { z } from "zod";

import {
  getAllEffectifsParMois,
  getEffectifFromMissionLocaleId,
} from "@/common/actions/mission-locale/mission-locale.actions";
import { enregistrerActiviteOrganisation } from "@/common/actions/organisations-activite.actions";
import { getOrganisationOrganismeByOrganismeId } from "@/common/actions/organisations.actions";
import {
  setEffectifMissionLocaleDataFromOrganisme,
  markEffectifNotificationAsRead,
} from "@/common/actions/organismes/mission-locale.actions";
import { getOrganismeById } from "@/common/actions/organismes/organismes.actions";
import type { AuthContext } from "@/common/model/internal/AuthContext";
import { validateFullZodObjectSchema } from "@/common/utils/validationUtils";
import objectIdSchema from "@/common/validation/objectIdSchema";
import { OrganismeLocals, returnResult, RouteHandler } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

export default () => {
  const router = express.Router();

  router.get("/effectifs-per-month", returnResult(getEffectifsParMoisMissionLocale));
  router.get("/effectif/:id", returnResult(getEffectifMissionLocale));
  router.put(
    "/effectif/:id",
    validateRequestMiddleware({ params: objectIdSchema("id"), body: zUpdateMissionLocaleEffectifOrganisme }),
    returnResult(updateEffectifMissionLocaleData)
  );
  router.put("/effectif/:id/mark-read", returnResult(markNotificationAsRead));

  return router;
};

const getEffectifsParMoisMissionLocale: RouteHandler<OrganismeLocals> = async (req, { locals }) => {
  const organisme = await getOrganisationOrganismeByOrganismeId(locals.organismeId);
  if (!organisme) {
    throw Boom.forbidden("No organisme found for the provided ID");
  }

  const userId = req.user?._id ? new ObjectId(req.user._id) : undefined;
  const result = await getAllEffectifsParMois(organisme, userId);

  return result;
};

const updateEffectifMissionLocaleData: RouteHandler<
  OrganismeLocals,
  { id: ObjectId },
  unknown,
  z.infer<typeof zUpdateMissionLocaleEffectifOrganisme>
> = async (req, { locals }) => {
  const organisme = await getOrganismeById(locals.organismeId);

  if (!organisme) {
    throw Boom.forbidden("No organisme found for the provided ID");
  }

  const userId = req.user?._id ? new ObjectId(req.user._id) : undefined;
  const ctx = req.user as AuthContext | undefined;
  await enregistrerActiviteOrganisation(ctx, ctx?.organisation_id);
  return await setEffectifMissionLocaleDataFromOrganisme(organisme._id, req.params.id, req.body, userId);
};

const getEffectifMissionLocale: RouteHandler<OrganismeLocals> = async (req, { locals }) => {
  const { nom_liste } = await validateFullZodObjectSchema(req.query, {
    nom_liste: z.enum([API_EFFECTIF_LISTE.A_TRAITER, API_EFFECTIF_LISTE.TRAITE]),
  });

  const effectifId = req.params.id;

  if (!ObjectId.isValid(effectifId)) {
    throw Boom.badRequest("Invalid effectif ID");
  }

  const organisme = await getOrganisationOrganismeByOrganismeId(locals.organismeId);

  if (!organisme) {
    throw Boom.forbidden("No organisme found for the provided ID");
  }

  const userId = req.user?._id ? new ObjectId(req.user._id) : undefined;
  const ctx = req.user as AuthContext | undefined;
  await enregistrerActiviteOrganisation(ctx, ctx?.organisation_id);
  return await getEffectifFromMissionLocaleId(organisme, effectifId, nom_liste, userId);
};

const markNotificationAsRead: RouteHandler<OrganismeLocals> = async (req, { locals }) => {
  const effectifId = req.params.id;

  if (!ObjectId.isValid(effectifId)) {
    throw Boom.badRequest("Invalid effectif ID");
  }

  const organisme = await getOrganismeById(locals.organismeId);

  if (!organisme) {
    throw Boom.forbidden("No organisme found for the provided ID");
  }

  if (!req.user?._id) {
    throw Boom.unauthorized("User not authenticated");
  }

  if (req.user?.impersonating) {
    throw Boom.forbidden("Cannot mark notification as read while impersonating");
  }

  const userId = new ObjectId(req.user._id);
  return await markEffectifNotificationAsRead(organisme._id, new ObjectId(effectifId), userId);
};
