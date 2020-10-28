const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");

module.exports = ({ stats }) => {
  const router = express.Router();

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const allStats = await stats.getAllStats();
      return res.json({ stats: allStats });
    })
  );

  return router;
};
