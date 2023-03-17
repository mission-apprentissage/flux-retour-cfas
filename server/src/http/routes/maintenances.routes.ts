import express from "express";

import { findMaintenanceMessages } from "../../common/actions/maintenances.actions.js";

export default () => {
  const router = express.Router();

  router.get("/", async (req, res) => {
    const result = await findMaintenanceMessages();
    return res.json(result);
  });

  return router;
};
