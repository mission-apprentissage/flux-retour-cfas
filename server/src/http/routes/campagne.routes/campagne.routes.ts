import express from "express";

import requireMissionLocaleTokenAuthentication from "@/http/middlewares/requireMissionLocaleTokenAuthentication";

import missionLocaleCampagneRouter from "./mission-locale/mission-locale-campagne.route";

export default () => {
  const router = express.Router();

  router.use("/mission-locale/:id", requireMissionLocaleTokenAuthentication(), missionLocaleCampagneRouter());
  return router;
};
