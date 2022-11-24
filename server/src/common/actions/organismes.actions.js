import { ObjectId } from "mongodb";
import { getMetiersBySirets } from "../apis/apiLba.js";
import { organismesDb } from "../model/collections.js";
import { defaultValuesOrganisme, validateOrganisme } from "../model/next.toKeep.models/organismes.model.js";
import { buildTokenizedString } from "../utils/buildTokenizedString.js";
import { generateKey } from "../utils/cryptoUtils.js";
import { createPermission, hasPermission } from "./permissions.actions.js";
import { findRolePermissionById } from "./roles.actions.js";
import { getUser } from "./users.actions.js";

/**
 * Méthode de création d'un organisme
 * Checks uai format & existence
 * @param {*} organismeProps
 * @returns
 */
export const createOrganisme = async ({ uai, sirets = [], nom, ...data }) => {
  if (await organismesDb().countDocuments({ uai })) {
    throw new Error(`Un organisme avec l'uai ${uai} existe déjà`);
  }

  // TODO [metier] really used ?
  let metiers = [];
  if (Array.isArray(sirets) && sirets.length !== 0) {
    metiers = (await getMetiersBySirets(sirets))?.metiers ?? [];
  }

  const { insertedId } = await organismesDb().insertOne(
    validateOrganisme({
      uai,
      ...(nom ? { nom: nom.trim(), nom_tokenized: buildTokenizedString(nom.trim(), 4) } : {}),
      ...defaultValuesOrganisme(),
      sirets,
      metiers,
      ...data,
    })
  );

  return await organismesDb().findOne({ _id: insertedId });
};

/**
 * Méthode de récupération d'organismes depuis un siret
 * Previously getFromSiret
 * @param {string} siret
 * @param {*} projection
 * @returns
 */
export const findOrganismesBySiret = async (siret, projection = {}) => {
  return await organismesDb()
    .find({ sirets: { $in: [siret] } }, { projection })
    .toArray();
};

/**
 * Méthode de récupération d'un organisme depuis un uai
 * Previously getFromUai
 * @param {string} uai
 * @param {*} projection
 * @returns
 */
export const findOrganismeByUai = async (uai, projection = {}) => {
  return await organismesDb().findOne({ uai }, { projection });
};

/**
 * Méthode de récupération d'un organisme depuis un id
 * @param {string|ObjectId} id
 * @param {*} projection
 * @returns
 */
export const findOrganismeById = async (id, projection = {}) => {
  const role = await organismesDb().findOne({ _id: ObjectId(id) }, { projection });
  return role;
};

/**
 * Méthode de récupération d'un organisme versatile par query
 * @param {*} query
 * @param {*} projection
 * @returns
 */
export const findOrganismeByQuery = async (query, projection = {}) => {
  return await organismesDb().findOne(query, { projection });
};

/**
 * Méthode de récupération d'organismes versatile par query
 * @param {*} query
 * @param {*} projection
 * @returns
 */
export const findOrganismesByQuery = async (query, projection = {}) => {
  return await organismesDb().find(query, { projection }).toArray();
};

/**
 * Méthode de mise à jour d'un organisme depuis son id
 * @param {*} id
 * @returns
 */
export const updateOrganisme = async (id, { nom, sirets, ...data }) => {
  const _id = typeof id === "string" ? ObjectId(id) : id;
  if (!ObjectId.isValid(_id)) throw new Error("Invalid id passed");

  const organisme = await organismesDb().findOne({ _id });
  if (!organisme) {
    throw new Error(`Unable to find organisme ${_id.toString()}`);
  }

  // TODO [metier] really used ?
  let metiers = [];
  if (sirets && Array.isArray(sirets) && !sirets.every((newSiret) => organisme.sirets.includes(newSiret))) {
    metiers = (await getMetiersBySirets(sirets))?.metiers ?? [];
  }

  const updated = await organismesDb().findOneAndUpdate(
    { _id: organisme._id },
    {
      $set: validateOrganisme({
        uai: organisme.uai,
        ...data,
        ...(nom ? { nom: nom.trim(), nom_tokenized: buildTokenizedString(nom.trim(), 4) } : {}),
        metiers,
        updated_at: new Date(),
      }),
    },
    { returnDocument: "after" }
  );

  return updated.value;
};

/**
 * Méthode d'ajout d'un contributeur à un organisme
 * @param {*} organisme_id
 * @returns
 */
export const addContributeurOrganisme = async (organisme_id, userEmail, as, pending = true, custom_acl = []) => {
  const _id = typeof id === "string" ? ObjectId(organisme_id) : organisme_id;
  if (!ObjectId.isValid(_id)) throw new Error("Invalid id passed");

  const organisme = await organismesDb().findOne({ _id });
  if (!organisme) {
    throw new Error(`Unable to find organisme ${_id.toString()}`);
  }

  await createPermission({
    organisme_id: organisme._id,
    userEmail: userEmail.toLowerCase(),
    role: as,
    custom_acl,
    pending,
  });

  const updated = await organismesDb().findOneAndUpdate(
    { _id: organisme._id },
    {
      $set: validateOrganisme({
        uai: organisme.uai,
        updated_at: new Date(),
      }),
      $addToSet: {
        contributeurs: userEmail.toLowerCase(),
      },
    },
    { returnDocument: "after" }
  );

  return updated.value;
};

export const getContributeurs = async (organisme_id) => {
  const _id = typeof id === "string" ? ObjectId(organisme_id) : organisme_id;
  if (!ObjectId.isValid(_id)) throw new Error("Invalid id passed");

  const organisme = await organismesDb().findOne({ _id });
  if (!organisme) {
    throw new Error(`Unable to find organisme ${_id.toString()}`);
  }

  const buildContributeursResult = async (contributeurEmail, organisme_id) => {
    const userSelectFields = { email: 1, nom: 1, prenom: 1, _id: 0 };
    const permSelectFields = { pending: 1, created_at: 1, role: 1, custom_acl: 1 };
    const roleSelectFields = { name: 1, description: 1, title: 1, _id: 1 };

    const currentUser = (await getUser(contributeurEmail, userSelectFields)) || {
      email: contributeurEmail,
      nom: "",
      prenom: "",
    };

    const currentUserPerm = await hasPermission({ organisme_id, userEmail: contributeurEmail }, permSelectFields);
    if (!currentUserPerm) {
      throw new Error("Something went wrong");
    }
    const currentUserRole = await findRolePermissionById(currentUserPerm.role, roleSelectFields);
    if (!currentUserRole) {
      throw new Error("Something went wrong");
    }
    return {
      user: currentUser,
      permission: {
        permId: currentUserPerm._id,
        created_at: currentUserPerm.created_at,
        customAcl: currentUserPerm.custom_acl,
        ...currentUserRole,
      },
    };
  };

  const contributeurs = [];
  for (const contributeur of organisme.contributeurs) {
    contributeurs.push(await buildContributeursResult(contributeur));
  }

  return contributeurs;
};

export const updateOrganismeApiKey = async (id) => {
  const _id = typeof id === "string" ? ObjectId(id) : id;
  if (!ObjectId.isValid(_id)) throw new Error("Invalid id passed");

  const organisme = await organismesDb().findOne({ _id });
  if (!organisme) {
    throw new Error(`Unable to find organisme ${_id.toString()}`);
  }

  const key = generateKey();
  // const secretHash = generateSecretHash(key); // TODO [metier/tech] Should be like this but users are not ready yet

  await organismesDb().findOneAndUpdate(
    { _id: organisme._id },
    {
      $set: {
        api_key: key,
      },
    }
  );

  return key;
};

////////

// TODO [tech] USELESS ABSTRACTION HERE => only in route
// /**
//  * Retourn la liste des organismes matching passed criteria
//  * @param {{}} searchCriteria
//  * @return {Array<{uai: string, nom: string}>} Array of CFA information
//  */
// const searchOrganismes = async (searchCriteria) => {
//   const { searchTerm, ...otherCriteria } = searchCriteria;
//   const SEARCH_RESULTS_LIMIT = 50;

//   const matchStage = {};
//   if (searchTerm) {
//     matchStage.$or = [
//       { $text: { $search: searchTerm } },
//       { uai: new RegExp(escapeRegExp(searchTerm), "g") },
//       { sirets: new RegExp(escapeRegExp(searchTerm), "g") },
//     ];
//   }
//   // if other criteria have been provided, find the list of uai matching those criteria in the DossierApprenant collection
//   if (Object.keys(otherCriteria).length > 0) {
//     const eligibleUais = await dossiersApprenantsDb().distinct("uai_etablissement", otherCriteria);
//     matchStage.uai = { $in: eligibleUais };
//   }

//   const sortStage = searchTerm
//     ? {
//         score: { $meta: "textScore" },
//         nom_etablissement: 1,
//       }
//     : { nom_etablissement: 1 };

//   const found = await organismesDb()
//     .aggregate([{ $match: matchStage }, { $sort: sortStage }, { $limit: SEARCH_RESULTS_LIMIT }])
//     .toArray();

//   return found.map((cfa) => {
//     return {
//       uai: cfa.uai,
//       sirets: cfa.sirets,
//       nom: cfa.nom,
//       nature: cfa.nature,
//       departement: getDepartementCodeFromUai(cfa.uai),
//     };
//   });
// };

// TODO [tech] SHOULD NOT BE HERE => dossiersApprentisMigration component ?
// /**
//  * Returns the first date of dossierApprenant transmission for a UAI
//  * @param {*} uai
//  * @returns
//  */
/*
const getCfaFirstTransmissionDateFromUai = async (uai) => {
  const historiqueDatesDossierApprenantWithUai = await dossiersApprenantsDb()
    .find({ uai_etablissement: uai })
    .sort("created_at")
    .limit(1)
    .toArray();

  return historiqueDatesDossierApprenantWithUai.length > 0
    ? historiqueDatesDossierApprenantWithUai[0].created_at
    : null;
};
*/

// /**
//  * Returns the first date of dossierApprenant transmission for a SIRET
//  * @param {*} uai
//  * @returns {Date|null}
//  */
/*const getCfaFirstTransmissionDateFromSiret = async (siret) => {
  const historiqueDatesDossiersApprenantsWithSiret = await dossiersApprenantsDb()
    .find({ siret_etablissement: siret })
    .sort("created_at")
    .limit(1)
    .toArray();

  return historiqueDatesDossiersApprenantsWithSiret.length > 0
    ? historiqueDatesDossiersApprenantsWithSiret[0].created_at
    : null;
};
*/

// /**
//  * Returns sous-établissements by siret_etablissement for an uai_etablissement
//  * @param {string} uai_etablissement
//  * @returns {Array<{siret_etablissement: string, nom_etablissement: string}>}
//  */
/*
const getSousEtablissementsForUai = async (uai) => {
  return await dossiersApprenantsDb()
    .aggregate([
      { $match: { uai_etablissement: uai, siret_etablissement: { $ne: null } } },
      { $group: { _id: "$siret_etablissement", nom_etablissement: { $first: "$nom_etablissement" } } },
      { $project: { _id: 0, siret_etablissement: "$_id", nom_etablissement: "$nom_etablissement" } },
    ])
    .toArray();
};
*/
