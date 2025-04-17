import Boom from "boom";
import express from "express";

import { getAllMlFromOrganisations } from "@/common/actions/admin/mission-locale/mission-locale.admin.actions";
import { getMissionsLocales } from "@/common/apis/apiAlternance/apiAlternance";
import { returnResult } from "@/http/middlewares/helpers";

export default () => {
  const router = express.Router();

  router.get("/", returnResult(getAllMls));

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
