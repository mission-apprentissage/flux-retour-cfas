import { ObjectId } from "mongodb";

import { getMetiersBySiret } from "../../apis/apiLba.js";
import { organismesDb } from "../../model/collections.js";
import { defaultValuesOrganisme, validateOrganisme } from "../../model/organismes.model.js";
import { buildAdresseFromApiEntreprise } from "../../utils/adresseUtils.js";
import { buildTokenizedString } from "../../utils/buildTokenizedString.js";
import { generateKey } from "../../utils/cryptoUtils.js";
import { buildAdresseFromUai } from "../../utils/uaiUtils.js";
import { siretSchema } from "../../utils/validationUtils.js";
import { createPermission, hasPermission, removePermissions } from "../permissions.actions.js";
import { findRolePermissionById } from "../roles.actions.js";
import { getUser, structureUser } from "../users.actions.js";
import { getFormationsTreeForOrganisme } from "./organismes.formations.actions.js";
import { findDataFromSiret } from "../infoSiret.actions.js";
import logger from "../../logger.js";

/**
 * Méthode de création d'un organisme
 * Checks uai format & existence
 * @param {*} organismeProps
 * @returns
 */
export const createOrganisme = async (
  { uai, siret, nom: nomIn, adresse: adresseIn, ferme: fermeIn, ...data },
  options = { callLbaApi: true, buildFormationTree: true, buildInfosFromSiret: true }
) => {
  if (await organismesDb().countDocuments({ uai, siret })) {
    throw new Error(`Un organisme avec l'UAI ${uai} et le siret ${siret} existe déjà`);
  }

  const { callLbaApi, buildFormationTree, buildInfosFromSiret } = options;

  // Récupération des infos depuis API LBA si option active
  const metiers = callLbaApi ? await getMetiersFromLba(siret) : [];

  // Construction de l'arbre des formations de l'organisme si option active
  const formations = buildFormationTree ? (await getFormationsTreeForOrganisme(uai))?.formations || [] : [];

  // Récupération des infos depuis API Entreprise si option active, sinon renvoi des nom / adresse passé en paramètres
  const { nom, adresse, ferme, enseigne, raison_sociale } = buildInfosFromSiret
    ? await getOrganismeInfosFromSiret(siret)
    : { nom: nomIn?.trim(), adresse: adresseIn, ferme: fermeIn };

  const { insertedId } = await organismesDb().insertOne(
    validateOrganisme({
      ...(uai ? { uai } : {}),
      ...(nom ? { nom, nom_tokenized: buildTokenizedString(nom, 4) } : {}),
      ...defaultValuesOrganisme(),
      ...(siret ? { siret } : {}),
      metiers,
      formations,
      ...(adresse ? { adresse } : {}),
      ...data,
      ferme: ferme || false,
      ...(enseigne ? { enseigne } : {}),
      ...(raison_sociale ? { raison_sociale } : {}),
    })
  );

  return await organismesDb().findOne({ _id: insertedId });
};

/**
 * Fonction de récupération des métiers depuis l'API LBA
 * @param {*} siret
 * @returns
 */
const getMetiersFromLba = async (siret) => {
  let metiers = [];

  try {
    metiers = await getMetiersBySiret(siret);
  } catch (error) {
    logger.error(`getMetiersFromLba > Erreur ${error} `);
  }

  return metiers ?? [];
};

/**
 * Fonction de récupération d'informations depuis SIRET via API Entreprise via siret
 * @param {*} siret
 * @param {*} nomIn
 * @param {*} adresseIn
 * @returns
 */
export const getOrganismeInfosFromSiret = async (siret) => {
  let organismeInfos = {};

  if (siret) {
    const dataSiret = await findDataFromSiret(siret, true, false);

    if (dataSiret.messages.api_entreprise === "Ok") {
      organismeInfos.ferme = dataSiret.result.ferme;

      if (dataSiret.result.enseigne) {
        organismeInfos.enseigne = dataSiret.result.enseigne;
        organismeInfos.nom = dataSiret.result.enseigne;
      }

      if (dataSiret.result.entreprise_raison_sociale)
        organismeInfos.raison_sociale = dataSiret.result.entreprise_raison_sociale;

      organismeInfos.adresse = {
        ...(dataSiret.result.numero_voie ? { numero: dataSiret.result.numero_voie } : {}),
        ...(dataSiret.result.voie_complete ? { voie: dataSiret.result.voie_complete } : {}),
        ...(dataSiret.result.complement_adresse ? { complement: dataSiret.result.complement_adresse } : {}),
        ...(dataSiret.result.code_postal ? { code_postal: dataSiret.result.code_postal } : {}),
        ...(dataSiret.result.code_insee_localite ? { code_insee: dataSiret.result.code_insee_localite } : {}),
        ...(dataSiret.result.localite ? { commune: dataSiret.result.localite } : {}),
        ...(dataSiret.result.num_departement ? { departement: dataSiret.result.num_departement } : {}),
        ...(dataSiret.result.num_region ? { region: dataSiret.result.num_region } : {}),
        ...(dataSiret.result.num_academie ? { academie: dataSiret.result.num_academie } : {}),
        ...(dataSiret.result.adresse ? { complete: dataSiret.result.adresse } : {}),
      };
    } else {
      logger.error(`getOrganismeInfosFromSiret > Erreur sur le siret ${siret} via API Entreprise / API Cfa Dock`);
    }
  }

  return organismeInfos;
};

/**
 * Création d'un objet organisme depuis les données d'un dossierApprenant
 * @param {*} dossierApprenant
 * @returns
 */
export const structureOrganismeFromDossierApprenant = async (dossierApprenant) => {
  const { uai_etablissement, siret_etablissement, nom_etablissement } = dossierApprenant;

  const adresseForOrganisme = siret_etablissement
    ? await buildAdresseForOrganisme({ uai: uai_etablissement, siret: siret_etablissement })
    : {};

  return {
    ...defaultValuesOrganisme(),
    uai: uai_etablissement,
    siret: siret_etablissement,
    ...adresseForOrganisme,
    ...(nom_etablissement
      ? { nom: nom_etablissement.trim(), nom_tokenized: buildTokenizedString(nom_etablissement.trim(), 4) }
      : {}),
  };
};

/**
 * Méthode de récupération d'organismes depuis un siret
 * Previously getFromSiret
 * @param {string} siret
 * @param {*} projection
 * @returns
 */
export const findOrganismesBySiret = async (siret, projection = {}) => {
  return await organismesDb().find({ siret }, { projection }).toArray();
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
 * Méthode de récupération d'un organisme depuis un siret
 * @param {string} siret
 * @param {*} projection
 * @returns
 */
export const findOrganismeBySiret = async (siret, projection = {}) => {
  return await organismesDb().findOne({ siret }, { projection });
};

/**
 * Méthode de récupération d'un organisme depuis un UAI et un SIRET
 * @param {string} uai
 * @param {string} siret
 * @param {*} projection
 * @returns
 */
export const findOrganismeByUaiAndSiret = async (uai, siret, projection = {}) => {
  return await organismesDb().findOne({ uai, siret }, { projection });
};

/**
 * Méthode de récupération d'un organisme depuis un id
 * @param {string|ObjectId} id
 * @param {*} projection
 * @returns
 */
export const findOrganismeById = async (id, projection = {}) => {
  const found = await organismesDb().findOne({ _id: ObjectId(id) }, { projection });
  return found;
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
export const updateOrganisme = async (
  id,
  { nom: nomIn, adresse: adresseIn, ferme: fermeIn, siret, ...data },
  options = { callLbaApi: true, buildFormationTree: true, buildInfosFromSiret: true }
) => {
  const _id = typeof id === "string" ? ObjectId(id) : id;
  if (!ObjectId.isValid(_id)) throw new Error("Invalid id passed");

  const organisme = await organismesDb().findOne({ _id });
  if (!organisme) {
    throw new Error(`Unable to find organisme ${_id.toString()}`);
  }

  const { callLbaApi, buildFormationTree, buildInfosFromSiret } = options;

  // Récupération des infos depuis API LBA si option active
  const metiers = callLbaApi ? await getMetiersFromLba(siret) : [];

  // Construction de l'arbre des formations de l'organisme si option active
  const formations = buildFormationTree ? (await getFormationsTreeForOrganisme(organisme?.uai))?.formations || [] : [];

  // Récupération des infos depuis API Entreprise si option active, sinon renvoi des nom / adresse passé en paramètres
  const { nom, adresse, ferme, enseigne, raison_sociale } = buildInfosFromSiret
    ? await getOrganismeInfosFromSiret(siret)
    : { nom: nomIn, adresse: adresseIn, ferme: fermeIn || organisme.ferme };

  const updated = await organismesDb().findOneAndUpdate(
    { _id: organisme._id },
    {
      $set: validateOrganisme({
        ...(organisme.uai ? { uai: organisme.uai } : {}),
        siret,
        ...data,
        ...(nom ? { nom: nom.trim(), nom_tokenized: buildTokenizedString(nom.trim(), 4) } : {}),
        metiers,
        formations,
        ...(adresse ? { adresse } : {}),
        ...(ferme ? { ferme } : { ferme: false }),
        ...(enseigne ? { enseigne } : {}),
        ...(raison_sociale ? { raison_sociale } : {}),
        updated_at: new Date(),
      }),
    },
    { returnDocument: "after" }
  );

  return updated.value;
};

/**
 * TODO add to unit tests
 * Méthode d'ajout d'un contributeur à un organisme
 * @param {*} organisme_id
 * @returns
 */
export const addContributeurOrganisme = async (organisme_id, userEmail, roleName, pending = true, custom_acl = []) => {
  const _id = typeof organisme_id === "string" ? ObjectId(organisme_id) : organisme_id;
  if (!ObjectId.isValid(_id)) throw new Error("Invalid id passed");

  const organisme = await organismesDb().findOne({ _id });
  if (!organisme) {
    throw new Error(`Unable to find organisme ${_id.toString()}`);
  }

  await createPermission({
    organisme_id: organisme._id,
    userEmail: userEmail.toLowerCase(),
    roleName,
    custom_acl,
    pending,
  });

  const updated = await organismesDb().findOneAndUpdate(
    { _id: organisme._id },
    {
      $set: validateOrganisme({
        uai: organisme.uai,
        siret: organisme.siret,
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

/**
 * TODO add to unit tests
 * Méthode de suppression d'un contributeur à un organisme
 * @param {*} organisme_id
 * @returns
 */
export const removeContributeurOrganisme = async (organisme_id, userEmail) => {
  const _id = typeof organisme_id === "string" ? ObjectId(organisme_id) : organisme_id;
  if (!ObjectId.isValid(_id)) throw new Error("Invalid id passed");

  const organisme = await organismesDb().findOne({ _id });
  if (!organisme) {
    throw new Error(`Unable to find organisme ${_id.toString()}`);
  }

  await removePermissions({ organisme_id: organisme._id, userEmail });

  const updated = await organismesDb().findOneAndUpdate(
    { _id: organisme._id },
    {
      $pull: {
        contributeurs: userEmail.toLowerCase(),
      },
    },
    { returnDocument: "after" }
  );

  return updated.value;
};

/**
 * TODO add to unit tests
 * Méthode de récupération des contributeurs d'un organisme
 * @param {*} organisme_id
 * @returns
 */
export const getContributeurs = async (organismeId) => {
  const _id = typeof organismeId === "string" ? ObjectId(organismeId) : organismeId;
  if (!ObjectId.isValid(_id)) throw new Error("Invalid id passed");

  const organisme = await organismesDb().findOne({ _id });
  if (!organisme) {
    throw new Error(`Unable to find organisme ${_id.toString()}`);
  }

  const buildContributeursResult = async (contributeurEmail, orgId) => {
    const userSelectFields = { email: 1, nom: 1, prenom: 1, _id: 0 };
    const permSelectFields = { pending: 1, created_at: 1, role: 1, custom_acl: 1 };
    const roleSelectFields = { name: 1, description: 1, title: 1, _id: 1 };

    const currentUser = (await getUser(contributeurEmail, userSelectFields)) || {
      email: contributeurEmail,
      nom: "",
      prenom: "",
    };

    const currentUserPerm = await hasPermission(
      { organisme_id: ObjectId(orgId), userEmail: contributeurEmail },
      permSelectFields
    );

    if (!currentUserPerm) {
      logger.error(`Contributor ${contributeurEmail} has no permission for organisme ${orgId}. This should not happen`);
      return null;
    }
    const currentUserRole = await findRolePermissionById(currentUserPerm.role, roleSelectFields);
    if (!currentUserRole) {
      throw new Error("Something went wrong");
    }
    return {
      user: await structureUser(currentUser),
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
    contributeurs.push(await buildContributeursResult(contributeur, organismeId));
  }

  return contributeurs.filter((o) => o);
};

/**
 * TODO add to unit tests
 * Méthode de maj de l'api key d'un organisme
 * @param {*} id
 * @returns
 */
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

export const setOrganismeFirstDateTransmissionIfNeeded = async (id) => {
  const _id = typeof id === "string" ? ObjectId(id) : id;
  if (!ObjectId.isValid(_id)) throw new Error("Invalid id passed");

  const organisme = await organismesDb().findOne({ _id });
  if (!organisme) {
    throw new Error(`Unable to find organisme ${_id.toString()}`);
  }
  if (organisme.first_transmission_date) return organisme.first_transmission_date;

  const first_transmission_date = new Date();
  await organismesDb().findOneAndUpdate(
    { _id: organisme._id },
    {
      $set: {
        first_transmission_date,
        updated_at: new Date(),
      },
    }
  );
  return first_transmission_date;
};

/**
 * Méthode de récupération de l'adresse pour un organisme via ses props
 * Par défaut l'adresse est construite depuis l'UAI
 * Si l'organisme a un siret valide alors on récupère l'adresse depuis l'API Entreprise
 * @param {*} cfaProps
 */
export const buildAdresseForOrganisme = async ({ uai, siret }) => {
  let adresseForOrganisme = buildAdresseFromUai(uai);

  // Si siret est valide on récupère l'adresse via l'API Entreprise
  const validSiret = siretSchema().validate(siret);
  if (!validSiret.error) {
    adresseForOrganisme = await buildAdresseFromApiEntreprise(siret);
  }

  return adresseForOrganisme;
};
