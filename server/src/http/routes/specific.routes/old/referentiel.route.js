import express from "express";
import tryCatch from "../../../middlewares/tryCatchMiddleware.js";
import { RESEAUX_CFAS } from "../../../../common/constants/networksConstants.js";
import { REGIONS, DEPARTEMENTS } from "../../../../common/constants/territoiresConstants.js";
import { ORGANISMES_APPARTENANCE } from "../../../../common/constants/usersConstants.js";

export default () => {
  const router = express.Router();

  router.get(
    "/networks",
    tryCatch(async (req, res) => {
      const networks = Object.keys(RESEAUX_CFAS).map((id) => ({ id, nom: RESEAUX_CFAS[id].nomReseau }));
      return res.json(networks);
    })
  );

  router.get(
    "/regions",
    tryCatch(async (req, res) => {
      return res.json(REGIONS);
    })
  );

  router.get(
    "/departements",
    tryCatch(async (req, res) => {
      return res.json(DEPARTEMENTS);
    })
  );

  router.get(
    "/organismes-appartenance",
    tryCatch(async (req, res) => {
      const organismes = Object.keys(ORGANISMES_APPARTENANCE).map((id) => ({ id, nom: ORGANISMES_APPARTENANCE[id] }));
      return res.json(organismes);
    })
  );

  return router;
};
