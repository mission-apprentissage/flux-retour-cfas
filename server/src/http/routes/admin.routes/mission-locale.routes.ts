import Boom from "boom";
import { ObjectId } from "bson";
import express from "express";
import {
  IOrganisationMissionLocale,
  IUpdateMissionLocaleEffectif,
  updateMissionLocaleEffectifApi,
} from "shared/models";
import { extensions } from "shared/models/parts/zodPrimitives";
import { z } from "zod";

import {
  activateMissionLocale,
  getAllMlFromOrganisations,
  resetEffectifMissionLocaleDataAdmin,
  setEffectifMissionLocaleDataAdmin,
} from "@/common/actions/admin/mission-locale/mission-locale.admin.actions";
import { getAllEffectifsParMois } from "@/common/actions/mission-locale/mission-locale.actions";
import { getMissionsLocales } from "@/common/apis/apiAlternance/apiAlternance";
import { organisationsDb } from "@/common/model/collections";
import { returnResult } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

export default () => {
  const router = express.Router();

  router.get("/", returnResult(getAllMls));
  router.get("/:id/effectifs-per-month", returnResult(getEffectifsParMoisMissionLocale));

  router.post(
    "/activate",
    validateRequestMiddleware({
      body: z.object({ date: z.coerce.date(), missionLocaleId: z.string().regex(/^[0-9a-f]{24}$/) }),
    }),
    returnResult(activateMLAtDate)
  );

  router.put(
    "/effectif",
    validateRequestMiddleware({
      body: z.object({
        ...updateMissionLocaleEffectifApi,
        mission_locale_id: extensions.objectIdString(),
        effectif_id: extensions.objectIdString(),
      }),
    }),
    returnResult(updateMissionLocaleEffectif)
  );

  router.post(
    "/effectif/reset",
    validateRequestMiddleware({
      body: z.object({
        mission_locale_id: extensions.objectIdString(),
        effectif_id: extensions.objectIdString(),
      }),
    }),
    returnResult(resetMissionLocaleEffectif)
  );
  return router;
};

const getAllMls = async () => {
  const externalML = await getMissionsLocales();
  if (!externalML) {
    throw Boom.notFound("Aucune mission locale trouvée");
  }
  const organisationMl = await getAllMlFromOrganisations();

  return organisationMl
    .map((orga) => ({ organisation: orga, externalML: externalML.find((ml) => ml.id === orga.ml_id) }))
    .filter((ml) => ml.externalML);
};

export const getEffectifsParMoisMissionLocale = async (req) => {
  const id = req.params.id;
  if (!id) {
    throw Boom.badRequest("Missing id");
  }

  const missionLocale = (await organisationsDb().findOne({ _id: new ObjectId(id) })) as IOrganisationMissionLocale;
  if (!missionLocale) {
    throw Boom.notFound(`No Mission Locale found for id: ${id}`);
  }

  return await getAllEffectifsParMois(missionLocale._id, missionLocale.activated_at);
};

const updateMissionLocaleEffectif = async (req) => {
  const { mission_locale_id, effectif_id, ...rest } = req.body;
  return await setEffectifMissionLocaleDataAdmin(
    new ObjectId(mission_locale_id),
    new ObjectId(effectif_id),
    rest as IUpdateMissionLocaleEffectif,
    req.user
  );
};

const resetMissionLocaleEffectif = async (req) => {
  const { mission_locale_id, effectif_id } = req.body;

  return resetEffectifMissionLocaleDataAdmin(new ObjectId(mission_locale_id), new ObjectId(effectif_id), req.user);
};

const activateMLAtDate = ({ body }) => {
  const { date, missionLocaleId } = body;
  return activateMissionLocale(missionLocaleId, date);
};
