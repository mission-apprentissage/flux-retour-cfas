const express = require("express");
const roles = require("../../common/roles");
const permissionsMiddleware = require("../middlewares/permissionsMiddleware");
const { apiRoles } = require("../../common/roles");
const { Stats } = require("../../common/model");
const { dataSource, statsTypes } = require("../../common/model/constants");
const tryCatch = require("../middlewares/tryCatchMiddleware");

module.exports = () => {
  const router = express.Router();

  router.get(
    "/",
    permissionsMiddleware([apiRoles.administrator]),
    tryCatch(async (req, res) => {
      const allStats = await Stats.findOne({ dataSource: dataSource.all, type: statsTypes.tdbStats })
        .sort({ date: "desc" })
        .lean();
      const networksStats = await Stats.findOne({ type: statsTypes.networksStats }).sort({ date: "desc" }).lean();

      return res.json({
        stats: allStats?.data,
        networksStats: networksStats?.data,
      });
    })
  );

  router.get(
    "/:dataSource",
    tryCatch(async (req, res) => {
      const { dataSource } = req.params;
      const isUserAdmin = req.user.permissions.indexOf(roles.apiRoles.administrator) > -1;

      /* users can access stats from a given source if they are admin of the source of data */
      if ((dataSource && req.user.username === dataSource) || isUserAdmin) {
        const allStats = await Stats.findOne({ dataSource: dataSource, type: statsTypes.tdbStats })
          .sort({ date: "desc" })
          .lean();
        return res.json({ stats: allStats?.data });
      }

      return res.status(403).send("Not authorized");
    })
  );

  return router;
};
