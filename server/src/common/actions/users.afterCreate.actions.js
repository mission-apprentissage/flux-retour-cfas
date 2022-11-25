import { addContributeurOrganisme, findOrganismeByUai, findOrganismesByQuery } from "./organismes.actions.js";
import { createPermission, findPermissionsByQuery } from "./permissions.actions.js";
import { findRoleByName } from "./roles.actions.js";
import { updateMainOrganismeUser } from "./users.actions.js";

/**
 * Méthode d'ajouts des permissions en fonction de l'utilisateur
 * @param {*} user
 * @returns
 */
export const userAfterCreate = async ({
  user,
  pending = true,
  // notify = true,
  // mailer
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
        role: "organisme.readonly",
        pending,
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
        await addContributeurOrganisme(_id, userEmail, "organisme.readonly", pending);
      }
    }
  } else {
    if (reseau) {
      // user is scoped reseau
      const organismes = await findOrganismesByQuery({ reseaux: { $in: [reseau] } });
      for (const { _id } of organismes) {
        await addContributeurOrganisme(_id, userEmail, "organisme.readonly", pending);
      }
    } else if (erp) {
      // user is scoped erp
      const organismes = await findOrganismesByQuery({ erps: { $in: [erp] } });
      for (const { _id } of organismes) {
        await addContributeurOrganisme(_id, userEmail, "organisme.readonly", pending);
      }
    } else {
      // user is NOT cross_organismes and NOT scoped -> example OF
      const organisme = await findOrganismeByUai(uai); // uai
      if (!organisme) {
        throw new Error(`No organisme found for this uai ${uai}`);
      }

      if (!organisme.contributeurs.length) {
        // is the first user on this organisme
        await addContributeurOrganisme(organisme._id, userEmail, "organisme.admin", pending);
        await updateMainOrganismeUser({ organisme_id: organisme._id, userEmail });
        // TODO [metier] VALIDATION FLOW [1] => BE SURE HE IS WHO IS PRETEND TO BE
        // Notif TDB_admin or whatever who
      } else {
        const hasAtLeastOneContributeurNotPending = async (organisme_id, roleName = "organisme.admin") => {
          const roleDb = await findRoleByName(roleName, { _id: 1 });
          if (!roleDb) {
            throw new Error("Role doesn't exist");
          }

          const permissions = await findPermissionsByQuery({ organisme_id, role: roleDb._id }, { pending: 1 });
          return !!permissions.find(({ pending }) => !pending);
        };

        if (await hasAtLeastOneContributeurNotPending(organisme._id, "organisme.admin")) {
          await addContributeurOrganisme(organisme._id, userEmail, "organisme.readonly", pending);
          await updateMainOrganismeUser({ organisme_id: organisme._id, userEmail });
          // TODO [metier] VALIDATION FLOW [2] => organisme.admin Validate people that wants to join is organisme
          // Notif organisme.admin
        } else {
          // TODO [tech] OOPS NOBODY IS HERE TO VALIDATE =>  VALIDATION FLOW [1]
          throw new Error(`OOPS NOBODY IS HERE TO VALIDATE USER`);
        }
      }
    }
  }
};
