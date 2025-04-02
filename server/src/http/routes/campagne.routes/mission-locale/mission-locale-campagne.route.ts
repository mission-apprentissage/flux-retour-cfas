import express from "express";

import { getMissionLocaleEffectifInfoFromToken } from "@/common/actions/mission-locale/mission-locale.actions";
import { getLbaTrainingLinks } from "@/common/apis/lba/lba.api";
import { returnResult } from "@/http/middlewares/helpers";

export default () => {
  const router = express.Router();

  router.get("/", returnResult(getMissionLocaleEffectifInfoByToken));

  return router;
};

const getMissionLocaleEffectifInfoByToken = async (req: any, res: any) => {
  const token = res.locals.token;
  const effectif = await getMissionLocaleEffectifInfoFromToken(token);

  const lbaResponse = await getLbaTrainingLinks(effectif.formation.cfd, effectif.formation.rncp);

  let lbaUrl = null;
  if (lbaResponse && lbaResponse.data && lbaResponse.data.length) {
    lbaUrl = lbaResponse.data[0].lien_lba;
  }
  const response = {
    missionLocale: effectif.missionLocale,
    lbaUrl,
  };

  return response;
};
