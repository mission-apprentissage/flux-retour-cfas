import {
  addContributeurOrganisme,
  findOrganismeByUai,
  findOrganismesByQuery,
} from "./organismes/organismes.actions.js";
import {
  createPermission,
  findActivePermissionsByRoleName,
  hasAtLeastOneContributeurNotPending,
} from "./permissions.actions.js";
import { updateMainOrganismeUser } from "./users.actions.js";

/**
 * Méthode d'ajouts des permissions en fonction de l'utilisateur
 * @param {*} user
 * @returns
 */
export const userAfterCreate = async ({
  user,
  pending = true,
  notify = true,
  mailer,
  asRole = "organisme.statsonly",
}) => {
  // TODO [metier/tech] For invite Check if user has already permissions

  const {
    is_cross_organismes,
    codes_region,
    codes_academie,
    codes_departement,
    reseau,
    erp,
    email: userEmail,
    uai,
  } = user;

  // Below Flow
  if (is_cross_organismes) {
    if (!codes_region.length && !codes_academie.length && !codes_departement.length) {
      // user is cross_organismes and Non scoped = National ("Tranverse viewer")
      await createPermission({
        organisme_id: null,
        userEmail,
        roleName: "organisme.admin",
        pending: false,
      });
    } else {
      // user is cross_organismes and scoped
      let queryScoped = null;
      if (codes_region.length) {
        queryScoped = { "adresse.region": { $in: codes_region } };
      }
      if (codes_academie.length) {
        queryScoped = { "adresse.academie": { $in: codes_academie } };
      }
      if (codes_departement.length) {
        queryScoped = { "adresse.departement": { $in: codes_departement } };
      }

      const organismes = await findOrganismesByQuery(queryScoped);
      for (const { _id } of organismes) {
        await addContributeurOrganisme(_id, userEmail, "organisme.statsonly", pending);
      }

      if (notify) {
        await mailer.sendEmail(
          { to: "no-reply@tdb.apprentissage.beta.gouv.fr", payload: { user, type: "pilot" } },
          "validation_user_by_tdb_team"
        ); // Notif TDB_admin or whatever who
      }
    }
  } else {
    if (reseau) {
      // user is scoped reseau
      const organismes = await findOrganismesByQuery({ reseaux: { $in: [reseau] } });
      for (const { _id } of organismes) {
        await addContributeurOrganisme(_id, userEmail, "organisme.statsonly", pending);
      }
      if (notify) {
        await mailer.sendEmail(
          { to: "no-reply@tdb.apprentissage.beta.gouv.fr", payload: { user, type: "reseau" } },
          "validation_user_by_tdb_team"
        ); // Notif TDB_admin or whatever who
      }
    } else if (erp) {
      // user is scoped erp
      const organismes = await findOrganismesByQuery({ erps: { $in: [erp] } });
      for (const { _id } of organismes) {
        await addContributeurOrganisme(_id, userEmail, "organisme.statsonly", pending);
      }
      // TODO [metier] VALIDATION FLOW [1] => BE SURE HE IS WHO IS PRETEND TO BE
    } else {
      // user is NOT cross_organismes and NOT scoped -> example OF
      const organisme = await findOrganismeByUai(uai); // uai
      if (!organisme) {
        throw new Error(`No organisme found for this uai ${uai}`);
      }

      const hasAtLeastOneUserToValidate = await hasAtLeastOneContributeurNotPending(organisme._id, "organisme.admin");

      // TODO pour les organismes RESPONSABLE ou RESPONSABLE_FORMATEUR => Multiple Permissions
      // organisme.nature RESPONSABLE, FORMATEUR, RESPONSABLE_FORMATEUR

      if (!hasAtLeastOneUserToValidate && asRole === "organisme.admin") {
        // is the first user on this organisme
        await addContributeurOrganisme(organisme._id, userEmail, "organisme.admin", pending);
        await updateMainOrganismeUser({ organisme_id: organisme._id, userEmail });
        if (notify) {
          await mailer.sendEmail(
            { to: "no-reply@tdb.apprentissage.beta.gouv.fr", payload: { user, organisme } },
            "validation_first_organisme_user_by_tdb_team"
          ); // Notif TDB_admin or whatever who
        }
      } else {
        await addContributeurOrganisme(organisme._id, userEmail, asRole, pending); // "organisme.statsonly"
        await updateMainOrganismeUser({ organisme_id: organisme._id, userEmail });

        // Notif organisme.admin
        if (notify) {
          const usersToNotify = (
            await findActivePermissionsByRoleName(organisme._id, "organisme.admin", { userEmail: 1 })
          ).map(({ userEmail }) => userEmail);

          const accessType = {
            "organisme.admin": "Gestionnaire",
            "organisme.member": "Éditeur",
            "organisme.readonly": "Lecteur",
          };

          for (const userToNotify of usersToNotify) {
            await mailer.sendEmail(
              { to: userToNotify, payload: { user, organisme, type: accessType[asRole] } },
              "validation_user_by_orga_admin"
            );
          }
        }
      }
    }
  }
};
