const express = require("express");
const tryCatch = require("../middlewares/tryCatchMiddleware");

module.exports = () => {
  const router = express.Router();

  router.post(
    "/",
    tryCatch(async (req, res) => {
      return res.json({
        message: "Statut Candidats Secured route for user : " + req.user.username,
      });
    })
  );

  return router;
};
