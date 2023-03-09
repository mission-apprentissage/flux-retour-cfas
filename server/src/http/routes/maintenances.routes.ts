import express from "express";

import tryCatch from "../middlewares/tryCatchMiddleware";
import { findMaintenanceMessages } from "../../common/actions/maintenances.actions";

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
