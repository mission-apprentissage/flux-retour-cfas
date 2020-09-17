const express = require("express");
const { SampleEntity } = require("../../common/model");

module.exports = () => {
  const router = express.Router();
  router.get("/", async (req, res) => {
    res.json({
      stats: {
        nbItems: await SampleEntity.countDocuments(),
      },
    });
  });

  return router;
};
