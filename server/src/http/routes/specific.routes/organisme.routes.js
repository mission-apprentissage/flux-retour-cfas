import express from "express";
import Joi from "joi";
import tryCatch from "../../middlewares/tryCatchMiddleware.js";
import permissionsOrganismeMiddleware from "../../middlewares/permissionsOrganismeMiddleware.js";
import { findOrganismeById, getContributeurs, updateOrganisme } from "../../../common/actions/organismes.actions.js";
import { findEffectifs } from "../../../common/actions/effectifs.actions.js";
import { generateSifa } from "../../../common/actions/sifa.actions/sifa.actions.js";
import { updatePermissionPending } from "../../../common/actions/permissions.actions.js";
import { compact, get } from "lodash-es";

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
    tryCatch(async ({ query: { organisme_id, sifa } }, res) => {
      const effectifsDb = await findEffectifs(organisme_id);

      const effectifs = [];

      let requiredFieldsSifa = [
        "apprenant.nom",
        "apprenant.prenom",
        "apprenant.date_de_naissance",
        "apprenant.code_postal_de_naissance",
        "apprenant.sexe",
        "apprenant.derniere_situation",
        "apprenant.dernier_organisme_uai",
        "formation.duree_formation_relle",
      ];

      const requiredApprenantAdresseFieldsSifa = [
        "apprenant.adresse.voie",
        "apprenant.adresse.code_postal",
        "apprenant.adresse.commune",
      ];

      for (const effectifDb of effectifsDb) {
        const { _id, id_erp_apprenant, source, annee_scolaire, validation_errors, apprenant, formation } = effectifDb;

        effectifs.push({
          id: _id.toString(),
          id_erp_apprenant,
          organisme_id,
          annee_scolaire,
          source,
          validation_errors,
          formation,
          nom: apprenant.nom,
          prenom: apprenant.prenom,
          historique_statut: apprenant.historique_statut,
          ...(sifa
            ? {
                requiredSifa: compact(
                  [
                    ...(apprenant.adresse?.complete
                      ? [...requiredFieldsSifa, ...requiredApprenantAdresseFieldsSifa]
                      : requiredFieldsSifa),
                  ].map((fieldName) =>
                    !get(effectifDb, fieldName) || get(effectifDb, fieldName) === "" ? fieldName : undefined
                  )
                ),
              }
            : {}),
        });
      }

      return res.json(effectifs);
    })
  );

  router.get(
    "/sifa/export-csv-list",
    permissionsOrganismeMiddleware(["organisme/page_sifa2/telecharger"]),
    tryCatch(async ({ query: { organisme_id } }, res) => {
      const sifaCsv = await generateSifa(organisme_id);

      return res.attachment(`tdb-données-sifa-${organisme_id}.csv`).send(sifaCsv);
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

  router.get(
    "/contributors/confirm-access",
    permissionsOrganismeMiddleware(["organisme/page_parametres", "organisme/page_parametres/gestion_acces"]),
    tryCatch(async ({ query }, res) => {
      const { userEmail, organisme_id, validate } = await Joi.object({
        userEmail: Joi.string().email().required(),
        organisme_id: Joi.string().required(),
        validate: Joi.boolean().required(),
      }).validateAsync(query, { abortEarly: false });
      if (validate) {
        await updatePermissionPending({ organisme_id, userEmail, pending: false });
      } else {
        // TODO REJECTED PERM
      }
      return res.json({ ok: true });
    })
  );

  return router;
};
