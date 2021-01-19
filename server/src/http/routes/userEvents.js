const express = require("express");
const permissionsMiddleware = require("../middlewares/permissionsMiddleware");
const { administrator } = require("../../common/roles");
const tryCatch = require("../middlewares/tryCatchMiddleware");

module.exports = ({ userEvents }) => {
  const router = express.Router();

  router.post(
    "/last-date",
    permissionsMiddleware([administrator]),
    tryCatch(async (req, res) => {
      const lastDate = await userEvents.getLastUserEventDate({
        username: req.body.username,
        type: req.body.type,
        action: req.body.action,
      });

      return res.json({ lastDate });
    })
  );

  return router;
};
