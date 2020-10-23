const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const createStatsEnqueteDs = require("../../logic/enqueteDs/statsEnqueteDs");

module.exports = () => {
  const router = express.Router();

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const statsDs = await createStatsEnqueteDs();
      return res.json(statsDs);
    })
  );

  return router;
};
