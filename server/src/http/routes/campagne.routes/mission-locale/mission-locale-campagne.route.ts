import express from "express";

import { returnResult } from "@/http/middlewares/helpers";
import { getMissionLocaleEffectifInfoFromToken } from "@/common/actions/mission-locale/mission-locale.actions";
import { getLbaTrainingLinks } from "@/common/apis/lba/lba.api";

export default () => {
  const router = express.Router();

  router.get("/", returnResult(getMissionLocaleEffectifInfoByToken));

  return router;
};

const getMissionLocaleEffectifInfoByToken = async (req: any, res: any) => {
  const token = req.params.id
  const effectif = await getMissionLocaleEffectifInfoFromToken(token)

  
  const lbaResponse = await getLbaTrainingLinks("test", "test")
  let lbaUrl = null
  if (lbaResponse && lbaResponse.data && lbaResponse.data.length) {
    lbaUrl = lbaResponse[0].lien_lba
  }
  const response = {
    ...effectif,
    lbaUrl
  }

  return response;
};
