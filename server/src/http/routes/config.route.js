const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const config = require("../../../config");

module.exports = () => {
  const router = express.Router();

  router.get(
    "/",
    tryCatch(async (req, res) => {
      return res.json({
        config: config,
      });
    })
  );

  return router;
};
