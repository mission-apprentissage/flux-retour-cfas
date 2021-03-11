const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");

module.exports = ({ userEvents }) => {
  const router = express.Router();

  router.post(
    "/last-date",
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
