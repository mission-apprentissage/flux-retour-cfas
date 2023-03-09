import express from "express";
import tryCatch from "../../../middlewares/tryCatchMiddleware.js";
import { RESEAUX_CFAS } from "../../../../common/constants/networksConstants.js";
import { ORGANISMES_APPARTENANCE } from "../../../../common/constants/usersConstants.js";

export default () => {
  const router = express.Router();

  router.get(
    "/networks",
    tryCatch(async (req, res) => {
      // TODO : TMP on ne renvoie que les réseaux fiabilisés pour l'instant - débloquer le reste quand ce sera fiable
      const RESEAUX_CFAS_INVALID = ["ANASUP", "GRETA_VAUCLUSE", "CCI", "BTP_CFA"];
      const networks = Object.keys(RESEAUX_CFAS)
        .filter((item) => !RESEAUX_CFAS_INVALID.includes(item))
        .map((id) => ({ id, nom: RESEAUX_CFAS[id].nomReseau }));
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
