const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const path = require("path");
const fs = require("fs-extra");

module.exports = () => {
  const router = express.Router();

  router.get(
    "/",
    tryCatch(async (req, res) => {
      const localStatsFilePath = path.join(__dirname, "../../jobs/enqueteDs/stats/output/statsEnqueteDs.json");
      const localMissingSirenFilePath = path.join(
        __dirname,
        "../../jobs/enqueteDs/stats/data/missingSirenInCatalog.json"
      );
      const localMissingSiretFilePath = path.join(
        __dirname,
        "../../jobs/enqueteDs/stats/data/missingSiretInCatalog.json"
      );

      const stats = await fs.readJSON(localStatsFilePath);
      const missingSirens = await fs.readJSON(localMissingSirenFilePath);
      const missingSirets = await fs.readJSON(localMissingSiretFilePath);

      return res.json({ statsDs: stats, missingSirens: missingSirens, missingSirets: missingSirets });
    })
  );

  return router;
};
