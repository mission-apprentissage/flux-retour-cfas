import { addContributeurOrganisme, findOrganismeByUai, findOrganismesByQuery } from "./organismes.actions.js";
import { createPermission } from "./permissions.actions.js";

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
  // TODO Check if user has already permissions

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
      // user is cross_organismes and National ("super viewer")
      await createPermission({
        organisme_id: null,
        userEmail,
        role: "espace.readonly",
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
        await addContributeurOrganisme(_id, userEmail, "espace.readonly", pending);
      }
    }
  } else {
    if (reseau) {
      // user is scoped reseau
      const organismes = await findOrganismesByQuery({ reseaux: { $in: reseau } });
      for (const { _id } of organismes) {
        await addContributeurOrganisme(_id, userEmail, "espace.readonly", pending);
      }
    } else if (erp) {
      // user is scoped erp
      const organismes = await findOrganismesByQuery({ erps: { $in: erp } });
      for (const { _id } of organismes) {
        await addContributeurOrganisme(_id, userEmail, "espace.readonly", pending);
      }
    } else {
      // TODO user is NOT cross_organismes and NOT scoped -> example OF
      const organisme = await findOrganismeByUai(uai); // uai
      if (!organisme.contributeurs.length) {
        // is the first user on this organisme
        await addContributeurOrganisme(organisme._id, userEmail, "espace.admin", pending);
        // TODO VALIDATION FLOW => BE SURE HE IS WHO IS PRETEND TO BE
        // Notif TDB_admin or whatever who
      } else {
        await addContributeurOrganisme(organisme._id, userEmail, "espace.readonly", pending);
        // TODO VALIDATION FLOW => espace.admin Validate people that wants to join is organisme
        // Notif espace.admin
      }
    }
  }
};
