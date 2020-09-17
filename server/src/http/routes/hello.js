const express = require("express");
const logger = require("../../common/logger");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const logicModule = require("../../logic/logicModule");

/**
 * Sample route module for displaying hello message
 */
module.exports = () => {
  const router = express.Router();

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const msg = logicModule.getTestMessage("Hello World");
      logger.info(msg);
      return res.json({
        message: msg,
      });
    })
  );

  return router;
};
