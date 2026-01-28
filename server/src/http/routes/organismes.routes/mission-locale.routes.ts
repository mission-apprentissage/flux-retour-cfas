import Boom from "boom";
import { ObjectId } from "bson";
import express from "express";
import { API_EFFECTIF_LISTE } from "shared/models";
import { IMissionLocale2Effectif } from "shared/models/data/missionLocaleEffectif2.model";
import { updateMissionLocaleEffectifOrganismeApi } from "shared/models/routes/organismes/mission-locale/missions-locale.api";
import { z } from "zod";

import {
  getAllEffectifsParMois,
  getEffectifFromMissionLocaleId,
} from "@/common/actions/mission-locale/mission-locale.actions.v2";
import { getOrganisationOrganismeByOrganismeId } from "@/common/actions/organisations.actions";
import {
  setEffectifMissionLocaleDataFromOrganisme,
  markEffectifNotificationAsRead,
} from "@/common/actions/organismes/mission-locale.actions.v2";
import { getOrganismeById } from "@/common/actions/organismes/organismes.actions";
import { missionLocaleEffectifs2Db } from "@/common/model/collections";
import { validateFullZodObjectSchema } from "@/common/utils/validationUtils";
import { returnResult } from "@/http/middlewares/helpers";

export default () => {
  const router = express.Router();

  router.get("/effectifs-per-month", returnResult(getEffectifsParMoisMissionLocale));
  router.get("/effectif/:id", returnResult(getEffectifMissionLocale));
  router.put("/effectif/:id", returnResult(updateEffectifMissionLocaleData));
  router.put("/effectif/:id/mark-read", returnResult(markNotificationAsRead));

  return router;
};

const getEffectifsParMoisMissionLocale = async (req, { locals }) => {
  const organisme = await getOrganisationOrganismeByOrganismeId(locals.organismeId);
  if (!organisme) {
    throw Boom.forbidden("No organisme found for the provided ID");
  }

  const userId = req.user?._id ? new ObjectId(req.user._id) : undefined;
  const result = await getAllEffectifsParMois(organisme, userId);

  return result;
};

const updateEffectifMissionLocaleData = async (req, { locals }) => {
  const effectifId = req.params.id;
  const organisme = await getOrganismeById(locals.organismeId);

  if (!organisme) {
    throw Boom.forbidden("No organisme found for the provided ID");
  }

  const data = await validateFullZodObjectSchema(req.body, updateMissionLocaleEffectifOrganismeApi);

  const effectif: IMissionLocale2Effectif | null = await missionLocaleEffectifs2Db().findOne({
    effectifV2_id: new ObjectId(effectifId),
    "computed.formation.organisme_formateur_id": new ObjectId(organisme._id),
  });

  if (!effectif) {
    throw Boom.notFound("Effectif introuvable");
  }

  const userId = req.user?._id ? new ObjectId(req.user._id) : undefined;
  return await setEffectifMissionLocaleDataFromOrganisme(organisme._id, effectifId, data, userId);
};

const getEffectifMissionLocale = async (req, { locals }) => {
  const { nom_liste } = await validateFullZodObjectSchema(req.query, {
    nom_liste: z.enum([API_EFFECTIF_LISTE.A_TRAITER, API_EFFECTIF_LISTE.TRAITE]),
  });

  const effectifId = req.params.id;
  const organisme = await getOrganisationOrganismeByOrganismeId(locals.organismeId);

  if (!organisme) {
    throw Boom.forbidden("No organisme found for the provided ID");
  }

  const userId = req.user?._id ? new ObjectId(req.user._id) : undefined;
  return await getEffectifFromMissionLocaleId(organisme, effectifId, nom_liste, userId);
};

const markNotificationAsRead = async (req, { locals }) => {
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
