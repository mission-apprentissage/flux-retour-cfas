const express = require("express");
const tryCatch = require("../../middlewares/tryCatchMiddleware");

module.exports = ({ userEvents }) => {
  const router = express.Router();

  router.get(
    "/upload-history",
    tryCatch(async (req, res) => {
      try {
        const { user } = req;

        const uploadHistoryList = await userEvents.getUploadHistoryList({ username: user?.email });
        return res.json({ uploadHistoryList });
      } catch (err) {
        return res.json({ uploadHistoryList: [], error: err.message });
      }
    })
  );

  return router;
};
