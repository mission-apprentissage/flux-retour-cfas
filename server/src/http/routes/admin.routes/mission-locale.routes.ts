import Boom from "boom";
import express from "express";
import { z } from "zod";

import {
  activateMissionLocale,
  getAllMlFromOrganisations,
} from "@/common/actions/admin/mission-locale/mission-locale.admin.actions";
import { getMissionsLocales } from "@/common/apis/apiAlternance/apiAlternance";
import { returnResult } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

export default () => {
  const router = express.Router();

  router.get("/", returnResult(getAllMls));
  router.post(
    "/activate",
    validateRequestMiddleware({
      body: z.object({ date: z.coerce.date(), missionLocaleId: z.string().regex(/^[0-9a-f]{24}$/) }),
    }),
    returnResult(activateMLAtDate)
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

const activateMLAtDate = ({ body }) => {
  const { date, missionLocaleId } = body;
  return activateMissionLocale(missionLocaleId, date);
};
