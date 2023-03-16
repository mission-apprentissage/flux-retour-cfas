import express from "express";
import Joi from "joi";
import { compact, get } from "lodash-es";
import Boom from "boom";

import permissionsOrganismeMiddleware from "../../middlewares/permissionsOrganismeMiddleware.js";
import {
  findOrganismeById,
  getContributeurs,
  addContributeurOrganisme,
  removeContributeurOrganisme,
  updateOrganisme,
  searchOrganismes,
  findOrganismeByUai,
  getSousEtablissementsForUai,
} from "../../../common/actions/organismes/organismes.actions.js";
import { findRolePermission } from "../../../common/actions/roles.actions.js";
import { findEffectifs } from "../../../common/actions/effectifs.actions.js";
import { generateSifa, isEligibleSIFA } from "../../../common/actions/sifa.actions/sifa.actions.js";
import {
  removePermissions,
  updatePermission,
  updatePermissionsPending,
} from "../../../common/actions/permissions.actions.js";
import { getUserByEmail } from "../../../common/actions/users.actions.js";
import { uaiSchema, validateFullObjectSchema } from "../../../common/utils/validationUtils.js";
import { returnResult } from "../../middlewares/helpers.js";

export default ({ mailer }) => {
  const router = express.Router();

  router.get(
    "/entity/:id",
    permissionsOrganismeMiddleware(["organisme/tableau_de_bord"]),
    async ({ params, user }, res) => {
      const organisme = await findOrganismeById(params.id);

      res.json({
        ...organisme,
        acl: user.currentPermissionAcl,
      });
    }
  );

  router.put(
    "/entity/:id",
    permissionsOrganismeMiddleware(["organisme/page_parametres"]),
    // eslint-disable-next-line no-unused-vars
    async ({ body: { organisme_id, ...data }, params, user }, res) => {
      // TODO JOI
      const updatedOrganisme = await updateOrganisme(params.id, data);
      return res.json({
        ...updatedOrganisme,
        acl: user.currentPermissionAcl,
      });
    }
  );

  router.get(
    "/effectifs",
    permissionsOrganismeMiddleware(["organisme/page_effectifs"]),
    async ({ query: { organisme_id, sifa } }, res) => {
      const effectifsDb = await findEffectifs(organisme_id);

      const effectifs: any[] = [];

      let requiredFieldsSifa = [
        "apprenant.nom",
        "apprenant.prenom",
        "apprenant.date_de_naissance",
        "apprenant.code_postal_de_naissance",
        "apprenant.sexe",
        "apprenant.derniere_situation",
        "apprenant.dernier_organisme_uai",
        "apprenant.organisme_gestionnaire",
        "formation.duree_formation_relle",
      ];

      const requiredApprenantAdresseFieldsSifa = [
        "apprenant.adresse.voie",
        "apprenant.adresse.code_postal",
        "apprenant.adresse.commune",
      ];

      for (const effectifDb of effectifsDb) {
        const { _id, id_erp_apprenant, source, annee_scolaire, validation_errors, apprenant, formation } = effectifDb;

        let historique_statut = apprenant.historique_statut;
        const effectif = {
          id: _id.toString(),
          id_erp_apprenant,
          organisme_id,
          annee_scolaire,
          source,
          validation_errors,
          formation,
          nom: apprenant.nom,
          prenom: apprenant.prenom,
          historique_statut,
          ...(sifa
            ? {
                requiredSifa: compact(
                  [
                    ...(!apprenant.adresse?.complete
                      ? [...requiredFieldsSifa, ...requiredApprenantAdresseFieldsSifa]
                      : requiredFieldsSifa),
                  ].map((fieldName) =>
                    !get(effectifDb, fieldName) || get(effectifDb, fieldName) === "" ? fieldName : undefined
                  )
                ),
              }
            : {}),
        };

        if (sifa) {
          if (isEligibleSIFA({ historique_statut })) {
            effectifs.push(effectif);
          }
        } else {
          effectifs.push(effectif);
        }
      }

      return res.json(effectifs);
    }
  );

  router.get(
    "/sifa/export-csv-list",
    permissionsOrganismeMiddleware(["organisme/page_sifa/telecharger"]),
    async ({ query: { organisme_id } }, res) => {
      const sifaCsv = await generateSifa(organisme_id);

      return res.attachment(`tdb-données-sifa-${organisme_id}.csv`).send(sifaCsv);
    }
  );

  router.get(
    "/contributors",
    permissionsOrganismeMiddleware(["organisme/page_parametres", "organisme/page_parametres/gestion_acces"]),
    async ({ query: { organisme_id } }, res) => {
      const contributors = await getContributeurs(organisme_id);

      return res.json(contributors);
    }
  );

  router.post(
    "/contributors",
    permissionsOrganismeMiddleware(["organisme/page_parametres", "organisme/page_parametres/gestion_acces"]),
    async (req, res) => {
      const { userEmail, roleName, organisme_id } = await Joi.object({
        userEmail: Joi.string().email().required(),
        organisme_id: Joi.string().required(),
        roleName: Joi.string().required(),
      }).validateAsync(req.body, { abortEarly: false });

      if (!roleName.includes("organisme.")) {
        throw Boom.unauthorized("Something went wrong");
      }

      const organisme = await findOrganismeById(organisme_id);
      if (!organisme) {
        throw Boom.unauthorized("Accès non autorisé");
      }

      await addContributeurOrganisme(organisme_id, userEmail, roleName);

      return res.json({ ok: true });
    }
  );

  router.put(
    "/contributors",
    permissionsOrganismeMiddleware(["organisme/page_parametres", "organisme/page_parametres/gestion_acces"]),
    async (req, res) => {
      const { userEmail, roleName, organisme_id } = await Joi.object({
        userEmail: Joi.string().email().required(),
        organisme_id: Joi.string().required(),
        roleName: Joi.string().required(),
      }).validateAsync(req.body, { abortEarly: false });

      if (!roleName.includes("organisme.")) {
        throw Boom.unauthorized("Something went wrong");
      }

      const organisme = await findOrganismeById(organisme_id);
      if (!organisme) {
        throw Boom.unauthorized("Accès non autorisé");
      }

      await updatePermission({ organisme_id: organisme._id, userEmail, roleName });

      return res.json({ ok: true });
    }
  );

  router.delete(
    "/contributors",
    permissionsOrganismeMiddleware(["organisme/page_parametres", "organisme/page_parametres/gestion_acces"]),
    async (req, res) => {
      const { userEmail, organisme_id } = await Joi.object({
        userEmail: Joi.string().email().required(),
        organisme_id: Joi.string().required(),
      }).validateAsync(req.query, { abortEarly: false });

      if (req.user.email === userEmail) {
        throw Boom.badRequest("Something went wrong");
      }

      const organisme = await findOrganismeById(organisme_id);

      if (!organisme) {
        throw Boom.unauthorized("Accès non autorisé");
      }
      await removeContributeurOrganisme(organisme_id, userEmail);

      return res.json({ ok: true });
    }
  );

  router.get(
    "/roles_list",
    permissionsOrganismeMiddleware(["organisme/page_parametres", "organisme/page_parametres/gestion_acces"]),
    async (_req, res) => {
      const roles = await findRolePermission({}, { description: 1, title: 1, name: 1 });
      return res.json(roles);
    }
  );

  router.get(
    "/contributors/confirm-access",
    permissionsOrganismeMiddleware(["organisme/page_parametres", "organisme/page_parametres/gestion_acces"]),
    async ({ query }, res) => {
      const { userEmail, organisme_id, validate } = await Joi.object({
        userEmail: Joi.string().email().required(),
        organisme_id: Joi.string().required(),
        validate: Joi.boolean().required(),
      }).validateAsync(query, { abortEarly: false });

      const user = await getUserByEmail(userEmail);
      const organisme = await findOrganismeById(organisme_id);

      if (validate) {
        await updatePermissionsPending({ userEmail, organisme_id, pending: false });
        await mailer.sendEmail({ to: userEmail, payload: { user, organisme } }, "notify_access_granted");
      } else {
        await removePermissions({ organisme_id: organisme_id, userEmail });
        await mailer.sendEmail({ to: userEmail, payload: { user, organisme } }, "notify_access_rejected");
      }

      return res.json({ ok: true });
    }
  );

  const organismeSearchSchema = {
    searchTerm: Joi.string().min(3),
    etablissement_num_region: Joi.string().allow(null, ""),
    etablissement_num_departement: Joi.string().allow(null, ""),
    etablissement_reseaux: Joi.string().allow(null, ""),
  };
  router.post(
    "/search",
    returnResult(async (req) => {
      const search = await validateFullObjectSchema(req.body, organismeSearchSchema);
      return await searchOrganismes(search);
    })
  );

  const getByUaiSchema = {
    uai: uaiSchema(),
  };
  /**
   * Gets the dashboard data for cfa
   */
  router.get("/:uai", async (req, res) => {
    const { uai } = await validateFullObjectSchema(req.params, getByUaiSchema);
    const organisme = await findOrganismeByUai(uai);
    if (!organisme) {
      return res.status(404).json({ message: `No cfa found for UAI ${uai}` });
    }

    const sousEtablissements = await getSousEtablissementsForUai(uai);
    return res.json({
      libelleLong: organisme.nom,
      reseaux: organisme.reseaux,
      domainesMetiers: organisme.metiers,
      uai: organisme.uai,
      nature: organisme.nature,
      nature_validity_warning: organisme.nature_validity_warning,
      adresse: organisme.adresse,
      sousEtablissements,
    });
  });

  return router;
};
