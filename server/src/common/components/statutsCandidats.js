const { StatutCandidat, Cfa } = require("../model");
const {
  codesMajStatutsInterdits,
  codesStatutsMajStatutCandidats,
  duplicatesTypesCodes,
} = require("../model/constants");
const { validateUai } = require("../domain/uai");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { paginate } = require("../utils/miscUtils");
const { validateCfd } = require("../domain/cfd");
const { validateSiret } = require("../domain/siret");
const { buildTokenizedString } = require("../utils/buildTokenizedString");
const { existsFormation, createFormation, getFormationWithCfd } = require("./formations")();
const groupBy = require("lodash.groupby");

module.exports = () => ({
  existsStatut,
  getStatut,
  addOrUpdateStatuts,
  createStatutCandidat,
  updateStatut,
  getDuplicatesList,
  shouldCreateNewStatutCandidat,
});

const existsStatut = async ({ nom_apprenant, prenom_apprenant, id_formation, uai_etablissement }) => {
  const query = getFindStatutQuery(nom_apprenant, prenom_apprenant, id_formation, uai_etablissement);
  const count = await StatutCandidat.countDocuments(query);
  return count !== 0;
};

const getStatut = ({ nom_apprenant, prenom_apprenant, id_formation, uai_etablissement }) => {
  const query = getFindStatutQuery(nom_apprenant, prenom_apprenant, id_formation, uai_etablissement);
  return StatutCandidat.findOne(query);
};

/**
 * Checks if we should create a new statutCandidat if :
  - no found statut
  or
  - found statut has an existing SIRET but different than item to add/update
 * @param {*} item 
 * @param {*} foundItem 
 * @returns 
 */
const shouldCreateNewStatutCandidat = (item, foundItem) =>
  !foundItem || (foundItem.siret_etablissement !== null && foundItem.siret_etablissement !== item.siret_etablissement);

/**
 * Add or update a list of statuts
 * @param {*} itemsToAddOrUpdate
 * @returns
 */
const addOrUpdateStatuts = async (itemsToAddOrUpdate) => {
  const added = [];
  const updated = [];

  await asyncForEach(itemsToAddOrUpdate, async (item) => {
    const foundItem = await getStatut({
      nom_apprenant: item.nom_apprenant,
      prenom_apprenant: item.prenom_apprenant,
      id_formation: item.id_formation,
      uai_etablissement: item.uai_etablissement,
    });

    const shouldCreateStatutCandidat = shouldCreateNewStatutCandidat(item, foundItem);

    if (shouldCreateStatutCandidat) {
      const addedItem = await createStatutCandidat(item);
      added.push(addedItem);
    } else {
      const updatedItem = await updateStatut(foundItem._id, item);
      updated.push(updatedItem);
    }
  });

  return {
    added,
    updated,
  };
};

const updateStatut = async (existingItemId, toUpdate) => {
  if (!existingItemId) return null;

  const existingItem = await StatutCandidat.findById(existingItemId);

  // Check if maj statut is valid
  if (isMajStatutInvalid(existingItem.statut_apprenant, toUpdate.statut_apprenant)) {
    toUpdate.statut_mise_a_jour_statut = codesStatutsMajStatutCandidats.ko;
    toUpdate.erreur_mise_a_jour_statut = {
      date_mise_a_jour_statut: new Date(),
      ancien_statut: existingItem.statut_apprenant,
      nouveau_statut_souhaite: toUpdate.statut_apprenant,
    };
  } else {
    toUpdate.statut_mise_a_jour_statut = codesStatutsMajStatutCandidats.ok;
  }

  // statut_apprenant has changed?
  if (existingItem.statut_apprenant !== toUpdate.statut_apprenant) {
    toUpdate.date_mise_a_jour_statut = new Date();

    toUpdate.historique_statut_apprenant = [
      ...existingItem.historique_statut_apprenant,
      {
        valeur_statut: toUpdate.statut_apprenant,
        position_statut: existingItem.historique_statut_apprenant.length + 1,
        date_statut: new Date(),
      },
    ];
  }

  // Update & return
  const updateQuery = {
    ...toUpdate,
    updated_at: new Date(),
  };
  const updated = await StatutCandidat.findByIdAndUpdate(existingItemId, updateQuery, { new: true });
  return updated;
};

const createStatutCandidat = async (itemToCreate) => {
  // if statut candidat établissement has a VALID siret or uai, try to retrieve information in Referentiel CFAs
  const etablissementInReferentielCfaFromSiretOrUai =
    (validateSiret(itemToCreate.siret_etablissement) &&
      (await Cfa.findOne({ siret: itemToCreate.siret_etablissement }))) ||
    (validateUai(itemToCreate.uai_etablissement) && (await Cfa.findOne({ uai: itemToCreate.uai_etablissement })));

  // if statut candidat has a valid cfd, check if it exists in db and create it otherwise
  if (validateCfd(itemToCreate.id_formation) && !(await existsFormation(itemToCreate.id_formation))) {
    await createFormation(itemToCreate.id_formation);
  }

  const toAdd = new StatutCandidat({
    ine_apprenant: itemToCreate.ine_apprenant,
    nom_apprenant: itemToCreate.nom_apprenant,
    prenom_apprenant: itemToCreate.prenom_apprenant,
    prenom2_apprenant: itemToCreate.prenom2_apprenant,
    prenom3_apprenant: itemToCreate.prenom3_apprenant,
    ne_pas_solliciter: itemToCreate.ne_pas_solliciter,
    email_contact: itemToCreate.email_contact,
    nom_representant_legal: itemToCreate.nom_representant_legal,
    tel_representant_legal: itemToCreate.tel_representant_legal,
    tel2_representant_legal: itemToCreate.tel2_representant_legal,
    id_formation: itemToCreate.id_formation,
    id_formation_valid: validateCfd(itemToCreate.id_formation),
    libelle_court_formation: itemToCreate.libelle_court_formation,
    libelle_long_formation: itemToCreate.libelle_long_formation,
    niveau_formation: (await getFormationWithCfd(itemToCreate.id_formation))?.niveau,
    uai_etablissement: itemToCreate.uai_etablissement,
    uai_etablissement_valid: validateUai(itemToCreate.uai_etablissement),
    siret_etablissement: itemToCreate.siret_etablissement,
    siret_etablissement_valid: validateSiret(itemToCreate.siret_etablissement),
    nom_etablissement: itemToCreate.nom_etablissement,
    nom_etablissement_tokenized:
      itemToCreate.nom_etablissement && buildTokenizedString(itemToCreate.nom_etablissement, 3),
    statut_apprenant: itemToCreate.statut_apprenant,
    historique_statut_apprenant: [
      {
        valeur_statut: itemToCreate.statut_apprenant,
        position_statut: 1,
        date_statut: itemToCreate.date_metier_mise_a_jour_statut
          ? new Date(itemToCreate.date_metier_mise_a_jour_statut)
          : new Date(),
      },
    ],
    date_mise_a_jour_statut: itemToCreate.date_mise_a_jour_statut,
    date_metier_mise_a_jour_statut: itemToCreate.date_metier_mise_a_jour_statut,
    periode_formation: itemToCreate.periode_formation,
    annee_formation: itemToCreate.annee_formation,
    source: itemToCreate.source,

    // add network of etablissement if found in ReferentielCfa
    ...(etablissementInReferentielCfaFromSiretOrUai
      ? { etablissement_reseaux: etablissementInReferentielCfaFromSiretOrUai.reseaux }
      : {}),
  });
  return toAdd.save();
};

const getFindStatutQuery = (nom_apprenant = null, prenom_apprenant = null, id_formation, uai_etablissement) => ({
  nom_apprenant: nom_apprenant,
  prenom_apprenant: prenom_apprenant,
  id_formation: id_formation,
  uai_etablissement: uai_etablissement,
});

const isMajStatutInvalid = (statutSource, statutDest) => {
  return codesMajStatutsInterdits.some((x) => x.source === statutSource && x.destination === statutDest);
};

/**
 * Récupération de la liste des statuts en doublons stricts pour les filtres passés en paramètres
 * @param {*} duplicatesTypesCode
 * @param {*} filters
 * @returns
 */
const findStatutsDuplicates = async (duplicatesTypesCode, filters = {}) => {
  let unicityQueryGroup = {};

  switch (duplicatesTypesCode) {
    case duplicatesTypesCodes.all.code:
      unicityQueryGroup = {
        _id: {
          ine_apprenant: "$ine_apprenant",
          nom_apprenant: "$nom_apprenant",
          prenom_apprenant: "$prenom_apprenant",
          prenom2_apprenant: "$prenom2_apprenant",
          prenom3_apprenant: "$prenom3_apprenant",
          email_contact: "$email_contact",
          id_formation: "$id_formation",
          uai_etablissement: "$uai_etablissement",
        },
        // Ajout des ids unique de chaque doublons
        duplicatesIds: { $addToSet: "$_id" },
        count: { $sum: 1 },
        // Pour regroupement par uai
        uai_etablissement: { $first: "$uai_etablissement" },
      };
      break;

    case duplicatesTypesCodes.periode_formation.code:
      unicityQueryGroup = {
        _id: {
          ine_apprenant: "$ine_apprenant",
          nom_apprenant: "$nom_apprenant",
          prenom_apprenant: "$prenom_apprenant",
          prenom2_apprenant: "$prenom2_apprenant",
          prenom3_apprenant: "$prenom3_apprenant",
          email_contact: "$email_contact",
          id_formation: "$id_formation",
          uai_etablissement: "$uai_etablissement",
        },
        // Ajout des ids unique de chaque doublons
        duplicatesIds: { $addToSet: "$_id" },
        // Ajout des différentes periodes en doublon potentiel
        periodes: { $addToSet: "$periode_formation" },
        count: { $sum: 1 },
        // Pour regroupement par uai
        uai_etablissement: { $first: "$uai_etablissement" },
      };
      break;

    case duplicatesTypesCodes.id_formation.code:
      unicityQueryGroup = {
        _id: {
          ine_apprenant: "$ine_apprenant",
          nom_apprenant: "$nom_apprenant",
          prenom_apprenant: "$prenom_apprenant",
          prenom2_apprenant: "$prenom2_apprenant",
          prenom3_apprenant: "$prenom3_apprenant",
          email_contact: "$email_contact",
          uai_etablissement: "$uai_etablissement",
        },
        // Ajout des ids unique de chaque doublons
        duplicatesIds: { $addToSet: "$_id" },
        // Ajout des différents id_formation en doublon potentiel
        ids_formations: { $addToSet: "$id_formation" },
        count: { $sum: 1 },
        // Pour regroupement par uai
        uai_etablissement: { $first: "$uai_etablissement" },
      };
      break;

    case duplicatesTypesCodes.email_contact.code:
      unicityQueryGroup = {
        _id: {
          ine_apprenant: "$ine_apprenant",
          nom_apprenant: "$nom_apprenant",
          prenom_apprenant: "$prenom_apprenant",
          prenom2_apprenant: "$prenom2_apprenant",
          prenom3_apprenant: "$prenom3_apprenant",
          id_formation: "$id_formation",
          uai_etablissement: "$uai_etablissement",
        },
        // Ajout des ids unique de chaque doublons
        duplicatesIds: { $addToSet: "$_id" },
        // Ajout des différents email_contact en doublon potentiel
        emails_contact: { $addToSet: "$email_contact" },
        count: { $sum: 1 },
        // Pour regroupement par uai
        uai_etablissement: { $first: "$uai_etablissement" },
      };
      break;

    case duplicatesTypesCodes.ine.code:
      unicityQueryGroup = {
        _id: {
          nom_apprenant: "$nom_apprenant",
          prenom_apprenant: "$prenom_apprenant",
          prenom2_apprenant: "$prenom2_apprenant",
          prenom3_apprenant: "$prenom3_apprenant",
          email_contact: "$email_contact",
          id_formation: "$id_formation",
          uai_etablissement: "$uai_etablissement",
        },
        // Ajout des ids unique de chaque doublons
        duplicatesIds: { $addToSet: "$_id" },
        // Ajout des différente INE en doublon potentiel
        ines: { $addToSet: "$ine_apprenant" },
        count: { $sum: 1 },
        // Pour regroupement par uai
        uai_etablissement: { $first: "$uai_etablissement" },
      };
      break;

    case duplicatesTypesCodes.prenoms.code:
      unicityQueryGroup = {
        _id: {
          ine_apprenant: "$ine_apprenant",
          nom_apprenant: "$nom_apprenant",
          prenom_apprenant: "$prenom_apprenant",
          email_contact: "$email_contact",
          id_formation: "$id_formation",
          uai_etablissement: "$uai_etablissement",
        },
        // Ajout des ids unique de chaque doublons
        duplicatesIds: { $addToSet: "$_id" },
        // Ajout des différentes prenom2-3_apprenant en doublon potentiel
        prenoms2_apprenants: { $addToSet: "$prenom2_apprenant" },
        prenoms3_apprenants: { $addToSet: "$prenom3_apprenant" },
        count: { $sum: 1 },
        // Pour regroupement par uai
        uai_etablissement: { $first: "$uai_etablissement" },
      };
      break;

    default:
      throw new Error("findStatutsDuplicates Error :  duplicatesTypesCode not matching any code");
  }

  const statutsFound = await StatutCandidat.aggregate([
    // Filtrage sur les filtres passées en paramètres
    {
      $match: filters,
    },
    // Regroupement sur les critères d'unicité
    {
      $group: unicityQueryGroup,
    },
    // Récupération des statuts en doublons = regroupement count > 1
    {
      $match: {
        count: { $gt: 1 },
      },
    },
    { $sort: { _id: -1 } },
  ]);

  return statutsFound;
};

/**
 * Construction d'une liste de doublons de type duplicatesTypeCode de statutsCandidats
 * regroupés par UAI pour les filtres passés en paramètres
 * @param {*} duplicatesTypeCode
 * @param {*} filters
 * @param {*} page
 * @param {*} limit
 * @returns
 */
const getDuplicatesList = async (duplicatesTypeCode, filters = {}, page = 1, limit = 1000) => {
  // Récupération des doublons pour le type souhaité
  const duplicates = await findDuplicatesForDuplicateType(duplicatesTypeCode, filters);

  // Pagination des statuts trouvés
  const paginatedStatuts = paginate(duplicates, page, limit);

  // Regroupement par uai_etablissement
  const groupedDuplicates = groupBy(paginatedStatuts.data, "uai_etablissement");

  // Construction d'un tableau avec uai, doublons et nb de doublons
  const groupedData = Object.keys(groupedDuplicates).map((item) => ({
    uai: item,
    duplicates: groupedDuplicates[item],
    nbDuplicates: groupedDuplicates[item].length,
  }));

  return {
    data: groupedData,
    page: paginatedStatuts.page,
    per_page: paginatedStatuts.per_page,
    pre_page: paginatedStatuts.pre_page,
    next_page: paginatedStatuts.next_page,
    total: paginatedStatuts.total,
    total_pages: paginatedStatuts.total_pages,
  };
};

/**
 * Fonction de récupération des doublons en fonction d'un type de doublon souhaité
 * @param {*} duplicatesTypesCode
 * @param {*} filters
 * @returns
 */
const findDuplicatesForDuplicateType = async (duplicatesTypesCode, filters) => {
  const duplicates = await findStatutsDuplicates(duplicatesTypesCode, filters);

  if (duplicates) {
    switch (duplicatesTypesCode) {
      case duplicatesTypesCodes.all.code:
        return duplicates;

      case duplicatesTypesCodes.periode_formation.code:
        return duplicates.filter((item) => item.periodes.length > 1);

      case duplicatesTypesCodes.id_formation.code:
        return duplicates.filter((item) => item.ids_formations.length > 1);

      case duplicatesTypesCodes.email_contact.code:
        return duplicates.filter((item) => item.emails_contact.length > 1);

      case duplicatesTypesCodes.ine.code:
        return duplicates.filter((item) => item.ines.length > 1);

      case duplicatesTypesCodes.prenoms.code:
        return duplicates.filter((item) => item.prenoms2_apprenants.length > 1 || item.prenoms3_apprenants.length > 1);

      default:
        return [];
    }
  }

  return [];
};
