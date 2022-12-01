import express from "express";
import tryCatch from "../../middlewares/tryCatchMiddleware.js";
import permissionsOrganismeMiddleware from "../../middlewares/permissionsOrganismeMiddleware.js";
import { findOrganismeById, getContributeurs, updateOrganisme } from "../../../common/actions/organismes.actions.js";
import { findEffectifs } from "../../../common/actions/effectifs.actions.js";
import { generateSifa } from "../../../common/actions/sifa.actions/sifa.actions.js";

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

  router.put(
    "/entity/:id",
    permissionsOrganismeMiddleware(["organisme/page_parametres"]),
    // eslint-disable-next-line no-unused-vars
    tryCatch(async ({ body: { organisme_id, ...data }, params, user }, res) => {
      // TODO JOI
      const updatedOrganisme = await updateOrganisme(params.id, data);
      return res.json({
        ...updatedOrganisme,
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
        effectifs.push({
          id: _id.toString(),
          id_erp_apprenant,
          organisme_id,
          annee_scolaire,
          source,
          formation,
          nom: apprenant.nom,
          prenom: apprenant.prenom,
          historique_statut: apprenant.historique_statut,
        });
      }

      return res.json(effectifs);
    })
  );

  //http://localhost/api/v1/organisme/sifa/export-csv-list?organisme_id=6385ba0d75438191f0c3f1b9
  router.get(
    "/sifa/export-csv-list",
    permissionsOrganismeMiddleware(["organisme/page_sifa2/telecharger"]),
    tryCatch(async ({ query: { organisme_id } }, res) => {
      const sifaCsv = await generateSifa(organisme_id);

      // return res.json(sifa);

      return res.attachment("export-SIFA.csv").send(sifaCsv);
    })
  );

  router.get(
    "/contributors",
    permissionsOrganismeMiddleware(["organisme/page_parametres", "organisme/page_parametres/gestion_acces"]),
    tryCatch(async ({ query: { organisme_id } }, res) => {
      const contributors = await getContributeurs(organisme_id);

      return res.json(contributors);
    })
  );

  return router;
};
