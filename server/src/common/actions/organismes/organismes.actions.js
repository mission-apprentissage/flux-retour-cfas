import { ObjectId } from "mongodb";
import { getMetiersBySirets } from "../../apis/apiLba.js";
import { organismesDb } from "../../model/collections.js";
import { defaultValuesOrganisme, validateOrganisme } from "../../model/next.toKeep.models/organismes.model.js";
import { buildAdresseFromApiEntreprise } from "../../utils/adresseUtils.js";
import { buildTokenizedString } from "../../utils/buildTokenizedString.js";
import { generateKey } from "../../utils/cryptoUtils.js";
import { buildAdresseFromUai } from "../../utils/uaiUtils.js";
import { siretSchema } from "../../utils/validationUtils.js";
import { mapFiabilizedOrganismeUaiSiretCouple } from "../engine/engine.organismes.utils.js";
import {
  createPermission,
  hasPermission,
  removePermission,
  findPermissionByUserEmail,
} from "../permissions.actions.js";
import { findRolePermissionById } from "../roles.actions.js";
import { getUser, structureUser } from "../users.actions.js";
import { getFormationsTreeForOrganisme } from "./organismes.formations.actions.js";
import { findDataFromSiret } from "../infoSiret.actions.js";
import logger from "../../logger.js";

/**
 * Méthode de création d'un organisme qui applique en entrée des filtres / rejection
 * via la collection de fiabilisation sur les couples UAI-Siret
 * ainsi qu'un filtre d'existence dans la base ACCES 
// TODO Refacto la méthode pour renvoyer notValid ou toCreate ou existant
 */
// TODO abd: ??? DUPLICATE OF hydrateOrganisme ?
export const createAndControlOrganisme = async ({ uai, siret, nom, ...data }) => {
  // Applique le mapping de fiabilisation
  const { cleanUai, cleanSiret } = await mapFiabilizedOrganismeUaiSiretCouple({ uai, siret });

  // Si pas de siret après fiabilisation -> KO (+ Log?)
  if (!cleanSiret) throw new Error(`Impossible de créer l'organisme d'uai ${uai} avec un siret vide`);

  // Applique les règles de rejection si pas dans la db
  const organismeFoundWithUaiSiret = await findOrganismeByUaiAndSiret(cleanUai, cleanSiret);

  if (organismeFoundWithUaiSiret?._id) {
    return organismeFoundWithUaiSiret;
  } else {
    const organismeFoundWithSiret = await findOrganismeBySiret(cleanSiret);

    // Si pour le couple uai-siret IN on trouve le siret mais un uai différent -> KO (+ Log?)
    if (organismeFoundWithSiret?._id)
      throw new Error(
        `L'organisme ayant le siret ${siret} existe déja en base avec un uai différent : ${organismeFoundWithSiret.uai}`
      ); // TODO LOG ?

    const organismeFoundWithUai = await findOrganismeByUai(cleanUai);
    // Si pour le couple uai-siret IN on trouve l'uai mais un siret différent -> KO (+ Log?)
    if (organismeFoundWithUai?._id)
      throw new Error(
        `L'organisme ayant l'uai ${uai} existe déja en base avec un siret différent : ${organismeFoundWithUai.siret}`
      ); // TODO LOG ?

    // TODO CHECK BASE ACCES
    // TODO Create if ok acces
    const { insertedId } = await organismesDb().insertOne(
      validateOrganisme({
        uai,
        siret,
        ...(nom ? { nom: nom.trim(), nom_tokenized: buildTokenizedString(nom.trim(), 4) } : {}),
        ...defaultValuesOrganisme(),
        ...data,
      })
    );

    return await organismesDb().findOne({ _id: insertedId });
  }
};

/**
 * Méthode de création d'un organisme
 * Checks uai format & existence
 * @param {*} organismeProps
 * @returns
 */
export const createOrganisme = async ({
  uai,
  sirets = [],
  siret: siretIn,
  nom: nomIn,
  adresse: adresseIn,
  ...data
}) => {
  if (await organismesDb().countDocuments({ uai })) {
    throw new Error(`Un organisme avec l'uai ${uai} existe déjà`);
  }

  let siret = siretIn;
  if (Array.isArray(sirets) && sirets.length !== 0 && !siretIn) {
    siret = sirets[0];
  }
  if (Array.isArray(sirets) && sirets.length === 0 && siretIn) {
    sirets[0] = siretIn;
  }

  // TODO [metier] really used ?
  let metiers = [];
  if (Array.isArray(sirets) && sirets.length !== 0) {
    try {
      metiers = (await getMetiersBySirets(sirets))?.metiers ?? [];
    } catch (error) {
      console.log(error);
    }
  }

  let nom = nomIn;
  let adresse = adresseIn;
  let ferme = false;
  let enseigne = null;
  let raison_sociale = null;
  if (siret) {
    const dataSiret = await findDataFromSiret(siret, true, false);
    if (dataSiret.messages.api_entreprise === "Ok") {
      ferme = dataSiret.result.ferme;
      if (dataSiret.result.enseigne) enseigne = dataSiret.result.enseigne;
      if (dataSiret.result.entreprise_raison_sociale) raison_sociale = dataSiret.result.entreprise_raison_sociale;
      if (!nom) nom = dataSiret.result.enseigne;
      adresse = {
        ...(adresse ?? {}),
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
      // TODO Find adresse somewhere else
      logger.error(`createOrganisme > Erreur sur l'etablissement ${siret} via API Entreprise`);
    }
  }

  // Construction de l'arbre des formations de l'organisme
  const { formations } = await getFormationsTreeForOrganisme(uai);
  // TODO abd: hydrate other organismes from formations

  const { insertedId } = await organismesDb().insertOne(
    validateOrganisme({
      uai,
      ...(nom ? { nom: nom.trim(), nom_tokenized: buildTokenizedString(nom.trim(), 4) } : {}),
      ...defaultValuesOrganisme(),
      sirets,
      ...(siret ? { siret } : {}),
      metiers,
      formations,
      ...(adresse ? { adresse } : {}),
      ...data,
      ferme,
      ...(enseigne ? { enseigne } : {}),
      ...(raison_sociale ? { raison_sociale } : {}),
    })
  );

  return await organismesDb().findOne({ _id: insertedId });
};

/**
 * Méthode d'insert d'un organisme en base
 * @param {*} data
 * @returns
 */
export const insertOrganisme = async (data) => {
  const { insertedId } = await organismesDb().insertOne(validateOrganisme(data));
  return insertedId;
};

/**
 * Création d'un objet organisme depuis les données d'un dossierApprenant
 * @param {*} dossierApprenant
 * @returns
 */
export const structureOrganismeFromDossierApprenant = async (dossierApprenant) => {
  const { uai_etablissement, siret_etablissement, nom_etablissement } = dossierApprenant;

  const adresseForOrganisme = await buildAdresseForOrganisme({ uai: uai_etablissement, sirets: [siret_etablissement] });

  return {
    ...defaultValuesOrganisme(),
    uai: uai_etablissement,
    siret: siret_etablissement,
    sirets: [siret_etablissement],
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
 * Méthode de récupération d'un organisme depuis un siret
 * @param {string} siret
 * @param {*} projection
 * @returns
 */
export const findOrganismeBySiret = async (siret, projection = {}) => {
  return await organismesDb().findOne({ siret }, { projection });
};

/**
 * Méthode de récupération d'un organisme depuis un uai et un siret
 * Previously getFromUaiAndSiret
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
    try {
      metiers = (await getMetiersBySirets(sirets))?.metiers ?? [];
    } catch (error) {
      console.log(error);
    }
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

  const userPermission = await findPermissionByUserEmail(organisme._id, userEmail.toLowerCase());
  if (userPermission) {
    await removePermission(userPermission._id);
  }

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
      { organisme_id: orgId, userEmail: contributeurEmail },
      permSelectFields
    );
    if (!currentUserPerm) {
      throw new Error(`User ${contributeurEmail} has no permission for organisme ${orgId}`);
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

  return contributeurs;
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

/**
 * Méthode de récupération de l'adresse pour un organisme via ses props
 * Par défaut l'adresse est construite depuis l'UAI
 * Si l'organisme a un seul siret et qu'il est valide alors on récupère l'adresse depuis l'API Entreprise
 // TODO Voir quoi faire pour les organismes multi sirets
 * @param {*} cfaProps
 */
export const buildAdresseForOrganisme = async ({ uai, sirets }) => {
  let adresseForOrganisme = buildAdresseFromUai(uai);

  // Si un seul siret et qu'il est valide on récupère l'adresse via l'API Entreprise
  if (sirets.length === 1) {
    const siretForOrganisme = sirets[0];
    const validSiret = siretSchema().validate(siretForOrganisme);
    if (!validSiret.error) {
      adresseForOrganisme = await buildAdresseFromApiEntreprise(siretForOrganisme);
    }
  }

  return adresseForOrganisme;
};
