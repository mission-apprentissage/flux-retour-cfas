const express = require("express");
const roles = require("../../common/roles");
const permissionsMiddleware = require("../middlewares/permissionsMiddleware");
const { administrator } = require("../../common/roles");
const tryCatch = require("../middlewares/tryCatchMiddleware");

module.exports = ({ stats, userEvents }) => {
  const router = express.Router();

  router.get(
    "/",
    permissionsMiddleware([administrator]),
    tryCatch(async (req, res) => {
      const allStats = await stats.getAllStats();
      const lastImportDates = await userEvents.getLastImportDatesForSources();
      return res.json({ stats: allStats, lastImportDates });
    })
  );

  router.get(
    "/:dataSource",
    tryCatch(async (req, res) => {
      const { dataSource } = req.params;
      const isUserAdmin = req.user.permissions.indexOf(roles.administrator) > -1;

      /* users can access stats from a given source if they are admin of the source of data */
      if ((dataSource && req.user.username === dataSource) || isUserAdmin) {
        const allStats = await stats.getAllStats({ source: dataSource });

        return res.json({ stats: allStats });
      }

      return res.status(403).send("Not authorized");
    })
  );

  return router;
};
