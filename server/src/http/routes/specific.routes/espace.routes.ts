import express from "express";

import { findOrganismesByQuery } from "../../../common/actions/organismes/organismes.actions.js";
import { pageAccessMiddleware } from "../../middlewares/pageAccessMiddleware.js";

export default () => {
  const router = express.Router();

  router.get("/organismes", pageAccessMiddleware(["page/mes-organismes"]), async ({ user }, res) => {
    const query = !user.organisme_ids.length
      ? {}
      : { _id: { $in: user.organisme_ids.filter((id) => id.toString() !== user.main_organisme_id?.toString()) } };
    const organismes = await findOrganismesByQuery(query, {
      _id: 1,
      nom: 1,
      enseigne: 1,
      raison_sociale: 1,
      ferme: 1,
      nature: 1,
      adresse: 1,
      siret: 1,
      uai: 1,
      first_transmission_date: 1,
      last_transmission_date: 1,
      fiabilisation_statut: 1,
    });

    return res.json(
      organismes.map((organisme) => ({ ...organisme, nomOrga: organisme.enseigne || organisme.raison_sociale }))
    );
  });

  return router;
};
