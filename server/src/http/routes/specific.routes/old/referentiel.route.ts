import express from "express";
import tryCatch from "../../../middlewares/tryCatchMiddleware";
import { RESEAUX_CFAS } from "../../../../common/constants/networksConstants";
import { ORGANISMES_APPARTENANCE } from "../../../../common/constants/usersConstants";

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
    "/organismes-appartenance",
    tryCatch(async (req, res) => {
      const organismes = Object.keys(ORGANISMES_APPARTENANCE).map((id) => ({ id, nom: ORGANISMES_APPARTENANCE[id] }));
      return res.json(organismes);
    })
  );

  return router;
};
