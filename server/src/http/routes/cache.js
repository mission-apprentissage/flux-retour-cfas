const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");

module.exports = ({ cache }) => {
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
