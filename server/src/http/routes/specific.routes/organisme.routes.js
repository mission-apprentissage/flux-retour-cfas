import express from "express";
import tryCatch from "../../middlewares/tryCatchMiddleware.js";
import permissionsOrganismeMiddleware from "../../middlewares/permissionsOrganismeMiddleware.js";
import { findOrganismeById } from "../../../common/actions/organismes.actions.js";
import { findEffectifs } from "../../../common/actions/effectifs.actions.js";

export default () => {
  const router = express.Router();

  router.get(
    "/entity/:id",
    permissionsOrganismeMiddleware(["organisme/tableau_de_bord"]),
    tryCatch(async ({ params, user }, res) => {
      const organisme = await findOrganismeById(params.id);

      res.json({
        ...organisme,
        acl: user.currentPermissionAcl,
      });
    })
  );

  router.get(
    "/effectifs",
    permissionsOrganismeMiddleware(["organisme/page_effectifs"]),
    tryCatch(async ({ query: { organisme_id } }, res) => {
      const effectifsDb = await findEffectifs(organisme_id);

      const effectifs = [];
      for (const { _id, id_erp_apprenant, source, annee_scolaire, apprenant, formation } of effectifsDb) {
        // apprenant.historique_statut
        effectifs.push({
          id: _id.toString(),
          id_erp_apprenant,
          organisme_id,
          annee_scolaire,
          source,
          formation,
          nom: apprenant.nom,
          prenom: apprenant.prenom,
          historique_statut: [
            {
              valeur_statut: "inscrit",
              date_statut: "15/10/2022",
            },
            {
              valeur_statut: "apprenti",
              date_statut: "10/10/2022",
            },
          ],
          state: "missing", // state: "complete", // state: "error",
        });
      }

      return res.json(effectifs);
    })
  );

  return router;
};
