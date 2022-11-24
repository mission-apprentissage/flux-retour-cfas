import express from "express";
import tryCatch from "../../middlewares/tryCatchMiddleware.js";
// import Joi from "joi";
// import Boom from "boom";
import permissionsOrganismeMiddleware from "../../middlewares/permissionsOrganismeMiddleware.js";
// import config from "../../../config.js";
import { findOrganismeById } from "../../../common/actions/organismes.actions.js";

export default (components) => {
  const router = express.Router();

  // eslint-disable-next-line no-unused-vars
  const { mailer } = components;

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

  // router.put(
  //   "/entity/:id/info",
  //   permissionsOrganismeMiddleware(["organisme/page_parametres"]),
  //   tryCatch(async ({ body, params }, res) => {
  //     const { nom } = await Joi.object({
  //       nom: Joi.string().required(),
  //     })
  //       .unknown()
  //       .validateAsync(body, { abortEarly: false });

  //     const workspaceId = params.id;

  //     const updateWks = await workspaces.updateWorkspaceInfo(workspaceId, nom);

  //     return res.json(updateWks);
  //   })
  // );

  // router.get(
  //   "/dossiers",
  //   permissionsWorkspaceMiddleware(components, ["wks/page_espace/page_dossiers/voir_liste_dossiers"]),
  //   tryCatch(async ({ query: { workspaceId } }, res) => {
  //     let results = [];
  //     const dossiersWks = await dossiers.findDossiers({ workspaceId });
  //     for (let index = 0; index < dossiersWks.length; index++) {
  //       const dossier = dossiersWks[index];
  //       const contributeurs = await dossiers.getContributeurs(dossier._id, components);
  //       const cerfaDossier = await cerfas.findCerfaByDossierId(dossier._id);
  //       const nomDossier =
  //         cerfaDossier.apprenti.nom && cerfaDossier.apprenti.prenom
  //           ? cerfaDossier.apprenti.nom.toUpperCase() + " " + cerfaDossier.apprenti.prenom
  //           : dossier.nom;

  //       results.push({
  //         ...dossier,
  //         contributeurs,
  //         nomDossier,
  //       });
  //     }
  //     return res.json(results);
  //   })
  // );

  // router.get(
  //   "/sharedwithme",
  //   tryCatch(async ({ user }, res) => {
  //     const permWorkspaceIds = await permissions.findPermissions(
  //       { dossierId: null, userEmail: user.email },
  //       { workspaceId: 1, _id: 0 }
  //     );
  //     if (!permWorkspaceIds.length) {
  //       throw Boom.unauthorized("Accès non autorisé");
  //     }

  //     let results = [];
  //     for (let index = 0; index < permWorkspaceIds.length; index++) {
  //       const permWorkspaceId = permWorkspaceIds[index].workspaceId;
  //       const wks = await workspaces.findWorkspaceById(permWorkspaceId, {
  //         description: 1,
  //         nom: 1,
  //         siren: 1,
  //         owner: 1,
  //         _id: 1,
  //       });
  //       const owner = await users.getUserById(wks.owner, { email: 1, nom: 1, prenom: 1, _id: 0 });
  //       if (!owner) {
  //         throw Boom.badRequest("Something went wrong");
  //       }
  //       if (owner.email !== user.email) {
  //         results.push({
  //           ...wks,
  //           owner: {
  //             ...owner,
  //           },
  //         });
  //       }
  //     }

  //     return res.json(results); // TODO Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client
  //   })
  // );
  /*
  router.get(
    "/contributors",
    permissionsOrganismeMiddleware(["organisme/page_parametres", "organisme/page_parametres/gestion_acces"]),
    tryCatch(async ({ query: { workspaceId } }, res) => {
      const contributors = await workspaces.getContributeurs(workspaceId, components);
      return res.json(contributors);
    })
  );

  router.post(
    "/contributors",
    permissionsOrganismeMiddleware(components, [
      "organisme/page_parametres",
      "organisme/page_parametres/gestion_acces",
    ]),
    tryCatch(async ({ body, user }, res) => {
      let { workspaceId, userEmail, roleId } = await Joi.object({
        workspaceId: Joi.string().required(),
        userEmail: Joi.string().required(),
        roleId: Joi.string().required(),
        acl: Joi.array().items(Joi.string()).default([]), // TODO
      }).validateAsync(body, { abortEarly: false });

      const newUserRole = await roles.findRolePermissionById(roleId);
      if (!newUserRole || !newUserRole.name.includes("wks.")) {
        throw Boom.badRequest("Something went wrong");
      }

      const wks = await workspaces.findWorkspaceById(workspaceId, { contributeurs: 1, owner: 1, nom: 1 });

      const owner = await users.getUserById(wks.owner, { email: 1 });

      if (owner.email === userEmail) {
        throw Boom.badRequest("Something went wrong");
      }

      await workspaces.addContributeur(wks._id, userEmail, newUserRole.name);

      await mailer.sendEmail(
        userEmail,
        `[${config.env} Contrat publique apprentissage] Invitation à rejoindre l'espace "${wks.nom}"`,
        "inviteWorkspace",
        {
          username: user.username,
          civility: user.civility,
          wksname: wks.nom,
          user2role: newUserRole.title,
          publicUrl: config.publicUrl,
          tospaceUrl: `mes-dossiers/espaces-partages/${wks._id}/dossiers`,
        }
      );

      const contributors = await workspaces.getContributeurs(workspaceId, components);
      return res.json(contributors);
    })
  );

  router.put(
    "/contributors",
    permissionsOrganismeMiddleware(["organisme/page_parametres", "organisme/page_parametres/gestion_acces"]),
    tryCatch(async ({ body }, res) => {
      let { workspaceId, userEmail, roleId } = await Joi.object({
        workspaceId: Joi.string().required(),
        userEmail: Joi.string().required(),
        roleId: Joi.string().required(),
        acl: Joi.array().items(Joi.string()).default([]), // TODO
      }).validateAsync(body, { abortEarly: false });

      const newUserRole = await roles.findRolePermissionById(roleId);
      if (!newUserRole || !newUserRole.name.includes("wks.")) {
        throw Boom.badRequest("Something went wrong");
      }

      const wks = await workspaces.findWorkspaceById(workspaceId, { contributeurs: 1, owner: 1 });

      const owner = await users.getUserById(wks.owner, { email: 1 });

      if (owner.email === userEmail) {
        throw Boom.badRequest("Something went wrong");
      }

      await permissions.updatePermission({
        workspaceId,
        dossierId: null,
        userEmail,
        roleId: newUserRole._id,
        //acl,
      });

      const contributors = await workspaces.getContributeurs(workspaceId, components);
      return res.json(contributors);
    })
  );

  router.delete(
    "/contributors",
    permissionsOrganismeMiddleware([
      "organisme/page_parametres",
      "organisme/page_parametres/gestion_acces",
      "organisme/page_parametres/gestion_acces/supprimer_contributeur",
    ]),
    tryCatch(async ({ query }, res) => {
      let { workspaceId, userEmail, permId } = await Joi.object({
        workspaceId: Joi.string().required(),
        userEmail: Joi.string().required(),
        permId: Joi.string().required(),
      }).validateAsync(query, { abortEarly: false });

      const wks = await workspaces.findWorkspaceById(workspaceId, { contributeurs: 1, owner: 1 });

      const owner = await users.getUserById(wks.owner, { email: 1 });

      if (owner.email === userEmail) {
        throw Boom.badRequest("Something went wrong");
      }

      await workspaces.removeContributeur(workspaceId, userEmail, permId);

      const contributors = await workspaces.getContributeurs(workspaceId, components);
      return res.json(contributors);
    })
  );

  router.get(
    "/roles_list",
    permissionsOrganismeMiddleware(["organisme/page_parametres", "organisme/page_parametres/gestion_acces"]),
    tryCatch(async (req, res) => {
      const rolesList = await roles.findRolePermission({}, { name: 1, description: 1, title: 1, _id: 1, acl: 1 });
      const defaultList = rolesList.filter((role) => role.name.includes("wks."));
      return res.json(defaultList);
    })
  );
*/
  return router;
};
