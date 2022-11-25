import express from "express";
import tryCatch from "../../middlewares/tryCatchMiddleware.js";
import { findOrganismesByQuery } from "../../../common/actions/organismes.actions.js";
import { pageAccessMiddleware } from "../../middlewares/pageAccessMiddleware.js";

export default () => {
  const router = express.Router();

  router.get(
    "/organismes",
    pageAccessMiddleware(["page/mes-organismes"]),
    tryCatch(async ({ user }, res) => {
      const query = !user.organisme_ids.length ? {} : { _id: { $in: user.organisme_ids } };
      const organismes = await findOrganismesByQuery(query);
      return res.json(organismes);
    })
  );

  return router;
};
