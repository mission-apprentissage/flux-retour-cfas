import express from "express";

import { getStatOrganismes } from "../../../common/actions/organismes/organismes.actions.js";

export default () => {
  const router = express.Router();

  router.get("/stats", async (req, res) => {
    const result = await getStatOrganismes();
    return res.json(result);
  });

  return router;
};
