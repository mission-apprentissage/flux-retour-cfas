import Boom from "boom";
import { ObjectId } from "bson";
import express from "express";
import { IMissionLocaleEffectif, updateMissionLocaleEffectifApi } from "shared/models";
import { z } from "zod";

import {
  activateMissionLocale,
  getAllMlFromOrganisations,
  resetEffectifMissionLocaleDataAdmin,
  setEffectifMissionLocaleDataAdmin,
} from "@/common/actions/admin/mission-locale/mission-locale.admin.actions";
import { getMissionsLocales } from "@/common/apis/apiAlternance/apiAlternance";
import { missionLocaleEffectifsDb } from "@/common/model/collections";
import { returnResult } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

export default () => {
  const router = express.Router();

  router.get("/", returnResult(getAllMls));

  router.post(
    "/activate",
    validateRequestMiddleware({
      body: z.object({ date: z.coerce.date(), missionLocaleId: z.string() }),
    }),
    returnResult(activateMLAtDate)
  );

  router.put(
    "/:id",
    validateRequestMiddleware({
      body: z.object(updateMissionLocaleEffectifApi),
    }),
    returnResult(updateMissionLocaleEffectif)
  );

  router.post("/:id/reset", returnResult(resetMissionLocaleEffectif));
  return router;
};

const activateMLAtDate = ({ body }) => {
  const { date, missionLocaleId } = body;
  return activateMissionLocale(missionLocaleId, date);
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

const updateMissionLocaleEffectif = async ({ params, body }) => {
  const effectifId = params.id;

  const effectif: IMissionLocaleEffectif | null = await missionLocaleEffectifsDb().findOne({
    "effectif_snapshot._id": new ObjectId(effectifId),
  });

  if (!effectif) {
    throw Boom.notFound("Effectif introuvable");
  }

  return await setEffectifMissionLocaleDataAdmin(effectifId, body);
};

const resetMissionLocaleEffectif = async ({ params }) => {
  const effectifId = params.id;

  const effectif: IMissionLocaleEffectif | null = await missionLocaleEffectifsDb().findOne({
    "effectif_snapshot._id": new ObjectId(effectifId),
  });

  if (!effectif) {
    throw Boom.notFound("Effectif introuvable");
  }

  resetEffectifMissionLocaleDataAdmin(effectifId);
};
