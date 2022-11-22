import { findOrganismeByQuery, findOrganismesByQuery } from "./organismes.actions.js";

/**
 * Méthode d'ajouts des permissions en fonction de l'utilisateur
 * @param {*} user
 * @returns
 */
export const userAfterCreate = async ({ user, mailer, pending = true, notify = true }) => {
  // TODO Check if user has already permissions

  const { is_cross_organismes, codes_region, codes_academie, codes_departement, reseau, erp } = user;

  // Below Flow
  if (is_cross_organismes) {
    if (!codes_region.length && !codes_academie.length && !codes_departement.length) {
      // TODO user is cross_organismes and National
      // addPermission-> null, userEmail, "espace.readonly"
    } else {
      // TODO user is cross_organismes and scoped
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
      // * await addContributeurOrganisme() -> orgaId, userEmail, "espace.readonly"
    }
  } else {
    if (reseau) {
      // TODO user is scoped reseau
      const organismes = await findOrganismesByQuery({ reseaux: { $in: reseau } });
      // * await addContributeurOrganisme() -> orgaId, userEmail, "espace.readonly"
    } else if (erp) {
      // TODO user is scoped erp
      const organismes = await findOrganismesByQuery({ erps: { $in: erp } });
      // * await addContributeurOrganisme() -> orgaId, userEmail, "espace.readonly"
    } else {
      // TODO user is NOT cross_organismes and NOT scoped -> example OF
      // const organisme = await findOrganismeByQuery(Siret or UAI ? );
      // await addContributeurOrganisme() -> orgaId, userEmail, "espace.admin"
    }
  }
};
