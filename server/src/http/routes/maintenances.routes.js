import express from "express";

import tryCatch from "../middlewares/tryCatchMiddleware.js";
import { findMaintenanceMessages } from "../../common/actions/maintenances.actions.js";

export default () => {
  const router = express.Router();

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const result = await findMaintenanceMessages();
      return res.json(result);
    })
  );

  return router;
};
