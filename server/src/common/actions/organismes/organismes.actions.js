import { ObjectId } from "mongodb";

import { getMetiersBySiret } from "../../apis/apiLba.js";
import { organismesDb, effectifsDb, permissionsDb } from "../../model/collections.js";
import { defaultValuesOrganisme, validateOrganisme } from "../../model/organismes.model.js";
import { buildAdresseFromApiEntreprise } from "../../utils/adresseUtils.js";
import { buildTokenizedString } from "../../utils/buildTokenizedString.js";
import { buildAdresseFromUai, getDepartementCodeFromUai } from "../../utils/uaiUtils.js";
import { siretSchema } from "../../utils/validationUtils.js";
import { createPermission, removePermissions } from "../permissions.actions.js";
import { structureUser } from "../users.actions.js";
import { getFormationsTreeForOrganisme } from "./organismes.formations.actions.js";
import { findDataFromSiret } from "../infoSiret.actions.js";
import logger from "../../logger.js";
import { escapeRegExp } from "../../utils/regexUtils.js";
import { buildMongoPipelineFilterStages } from "../helpers/filters.js";

const SEARCH_RESULTS_LIMIT = 50;

/**
 * Méthode de récupération de l'adresse pour un organisme via ses props
 * Par défaut l'adresse est construite depuis l'UAI
 * Si l'organisme a un siret valide alors on récupère l'adresse depuis l'API Entreprise
 * @param {*} cfaProps
 */
const buildAdresseForOrganisme = async ({ uai, siret }) => {
  let adresseForOrganisme = buildAdresseFromUai(uai);

  // Si siret est valide on récupère l'adresse via l'API Entreprise
  const validSiret = siretSchema().validate(siret);
  if (!validSiret.error) {
    adresseForOrganisme = await buildAdresseFromApiEntreprise(siret);
  }

  return adresseForOrganisme;
};

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
    : { nom: nomIn?.trim(), adresse: adresseIn, ferme: fermeIn, enseigne: undefined, raison_sociale: undefined };

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
 * @param {string} siret
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
 * @returns Object
 */
const getOrganismeInfosFromSiret = async (siret) => {
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
    last_transmission_date: new Date(),
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
  const found = await organismesDb().findOne({ _id: new ObjectId(id) }, { projection });
  return found;
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
 * @param {string|ObjectId} id
 * @param {Object} data
 * @param {Object} options
 * @returns
 */
export const updateOrganisme = async (
  id,
  { nom: nomIn, adresse: adresseIn, ferme: fermeIn, siret, ...data },
  options = { callLbaApi: true, buildFormationTree: true, buildInfosFromSiret: true }
) => {
  const _id = typeof id === "string" ? new ObjectId(id) : id;
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
    : {
        nom: nomIn,
        adresse: adresseIn,
        ferme: typeof fermeIn === "boolean" ? fermeIn : organisme.ferme,
        enseigne: undefined,
        raison_sociale: undefined,
      }; // si aucun champ ferme fourni en entrée on récupère celui de l'organisme trouvé par son id

  const updated = await organismesDb().findOneAndUpdate(
    { _id: organisme._id },
    {
      $set: validateOrganisme({
        ...organisme,
        ...(organisme.uai ? { uai: organisme.uai } : {}),
        ...(siret ? { siret } : {}),
        ...data,
        ...(nom ? { nom: nom.trim(), nom_tokenized: buildTokenizedString(nom.trim(), 4) } : {}),
        metiers,
        formations,
        ...(adresse ? { adresse } : {}),
        ...(ferme ? { ferme } : { ferme: false }), // Si aucun champ ferme fourni false par défaut
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
  const _id = typeof organisme_id === "string" ? new ObjectId(organisme_id) : organisme_id;
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
};

/**
 * TODO add to unit tests
 * Méthode de suppression d'un contributeur à un organisme
 * @param {*} organisme_id
 * @returns
 */
export const removeContributeurOrganisme = async (organisme_id, userEmail) => {
  const _id = typeof organisme_id === "string" ? new ObjectId(organisme_id) : organisme_id;
  if (!ObjectId.isValid(_id)) throw new Error("Invalid id passed");

  const organisme = await organismesDb().findOne({ _id });
  if (!organisme) {
    throw new Error(`Unable to find organisme ${_id.toString()}`);
  }

  await removePermissions({ organisme_id: organisme._id, userEmail });
};

/**
 * TODO add to unit tests
 * Méthode de récupération des contributeurs d'un organisme
 * @param {string} organismeId
 * @returns
 */
export const getContributeurs = async (organismeId) => {
  const _id = typeof organismeId === "string" ? new ObjectId(organismeId) : organismeId;
  if (!ObjectId.isValid(_id)) throw new Error("Invalid id passed");

  const organisme = await organismesDb().findOne({ _id });
  if (!organisme) {
    throw new Error(`Unable to find organisme ${_id.toString()}`);
  }

  const permissionsWithUserAndRole = await permissionsDb()
    .aggregate([
      { $match: { organisme_id: organisme._id } },
      // lookup user
      {
        $lookup: {
          from: "usersMigration",
          localField: "userEmail",
          foreignField: "email",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      // lookup role
      {
        $lookup: {
          from: "roles",
          localField: "role",
          foreignField: "_id",
          as: "role",
        },
      },
      { $unwind: { path: "$role", preserveNullAndEmptyArrays: true } },
    ])
    .toArray();

  return Promise.all(
    permissionsWithUserAndRole.map(async (perm) => ({
      ...perm,
      user: perm.user ? await structureUser(perm.user) : null,
    }))
  );
};

/**
 * Méthode de maj des dates de transmission d'un organisme
 * @param {*} id
 * @returns
 */
export const setOrganismeTransmissionDates = async (id) => {
  const _id = typeof id === "string" ? new ObjectId(id) : id;
  if (!ObjectId.isValid(_id)) throw new Error("Invalid id passed");

  const organisme = await organismesDb().findOne({ _id });
  if (!organisme) throw new Error(`Unable to find organisme ${_id.toString()}`);

  // Si l'organisme n'a jamais transmis on set first_transmission_date et last_transmission_date
  if (!organisme.first_transmission_date) {
    await organismesDb().findOneAndUpdate(
      { _id: organisme._id },
      {
        $set: {
          first_transmission_date: new Date(),
          last_transmission_date: new Date(),
          updated_at: new Date(),
        },
      }
    );
  } else {
    // Si l'organisme a déja transmis on update uniquement last_transmission_date
    await organismesDb().findOneAndUpdate(
      { _id: organisme._id },
      { $set: { last_transmission_date: new Date(), updated_at: new Date() } }
    );
  }
};

/**
 * Returns sous-établissements by siret for an uai
 * @param {string} uai
 * @returns {Promise<Array<{siret_etablissement: string, nom_etablissement: string}>>}
 */
export const getSousEtablissementsForUai = async (uai) => {
  return await organismesDb()
    .aggregate([
      { $match: { uai, siret: { $ne: null } } },
      { $group: { _id: "$siret", nom: { $first: "$nom" } } },
      { $project: { _id: 0, siret: "$_id", nom: "$nom" } },
    ])
    .toArray();
};

/**
 * Retourne la liste des organismes correspondant aux critères de recherche
 * @param {import("./organismes.actions-struct.js").OrganismesSearch} searchCriteria
 * @return {Promise<{ uai: string; nom: string; }[]>} Array of CFA information
 */
export const searchOrganismes = async (searchCriteria) => {
  const matchStage = {};
  if (searchCriteria.searchTerm) {
    matchStage.$or = [
      { $text: { $search: searchCriteria.searchTerm } },
      { uai: new RegExp(escapeRegExp(searchCriteria.searchTerm), "g") },
      { siret: new RegExp(escapeRegExp(searchCriteria.searchTerm), "g") },
    ];
  }

  // if other criteria have been provided, find the list of uai matching those criteria in the DossierApprenant collection
  if (
    searchCriteria.etablissement_num_departement ||
    searchCriteria.etablissement_num_region ||
    searchCriteria.etablissement_reseaux
  ) {
    const start = Date.now();
    const eligibleUais = (
      await effectifsDb()
        .aggregate([...buildMongoPipelineFilterStages(searchCriteria), { $group: { _id: "$organisme.uai" } }])
        .toArray()
    ).map((row) => row._id[0]);
    logger.info({ elapsted: Date.now() - start, eligibleUais: eligibleUais.length }, "searchOrganismes_eligibleUais");
    matchStage.uai = { $in: eligibleUais };
  }

  const sortStage = searchCriteria.searchTerm
    ? {
        score: { $meta: "textScore" },
        "organisme.nom": 1,
      }
    : { "organisme.nom": 1 };

  const start = Date.now();
  const organismes = await organismesDb()
    .aggregate([{ $match: matchStage }, { $sort: sortStage }, { $limit: SEARCH_RESULTS_LIMIT }])
    .toArray();
  logger.info({ elapsted: Date.now() - start, organismes: organismes.length }, "searchOrganismes_organismes");

  return organismes.map((organisme) => {
    return {
      uai: organisme.uai,
      siret: organisme.siret,
      nom: organisme.nom,
      nature: organisme.nature,
      departement: organisme.uai ? getDepartementCodeFromUai(organisme.uai) : null,
    };
  });
};
