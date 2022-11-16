import express from "express";
import tryCatch from "../middlewares/tryCatchMiddleware.js";

export default ({ cache }) => {
  const router = express.Router();

  router.post(
    "/clear",
    tryCatch(async (req, res) => {
      await cache.clear();
      return res.json({});
    })
  );

  return router;
};
