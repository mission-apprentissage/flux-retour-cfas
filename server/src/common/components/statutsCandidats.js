const { StatutCandidat, Cfa } = require("../model");
const {
  codesMajStatutsInterdits,
  codesStatutsMajStatutCandidats,
  duplicatesTypesCodes,
} = require("../model/constants");
const { validateUai } = require("../domain/uai");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { validateCfd } = require("../domain/cfd");
const { validateSiret } = require("../domain/siret");
const { buildTokenizedString } = require("../utils/buildTokenizedString");
const { validateAnneeScolaire } = require("../domain/anneeScolaire");
const { existsFormation, createFormation, getFormationWithCfd } = require("./formations")();

module.exports = () => ({
  existsStatut,
  getStatut,
  addOrUpdateStatuts,
  createStatutCandidat,
  updateStatut,
  getDuplicatesList,
});

const existsStatut = async ({ nom_apprenant, prenom_apprenant, formation_cfd, uai_etablissement, annee_scolaire }) => {
  const query = getFindStatutQuery(nom_apprenant, prenom_apprenant, formation_cfd, uai_etablissement, annee_scolaire);
  const count = await StatutCandidat.countDocuments(query);
  return count !== 0;
};

const getStatut = ({ nom_apprenant, prenom_apprenant, formation_cfd, uai_etablissement, annee_scolaire }) => {
  const query = getFindStatutQuery(nom_apprenant, prenom_apprenant, formation_cfd, uai_etablissement, annee_scolaire);
  return StatutCandidat.findOne(query);
};

/**
 * Add or update a list of statuts
 * @param {*} itemsToAddOrUpdate
 * @returns
 */
const addOrUpdateStatuts = async (itemsToAddOrUpdate) => {
  const added = [];
  const updated = [];

  await asyncForEach(itemsToAddOrUpdate, async (item) => {
    const anneeScolaireValidation = validateAnneeScolaire(item.annee_scolaire);

    // for now we don't want to throw an error for missing annee_scolaire, we will just ignore the item
    // TODO move it to API joi schema
    if (anneeScolaireValidation.error) {
      return;
    }
    const foundItem = await getStatut({
      nom_apprenant: item.nom_apprenant,
      prenom_apprenant: item.prenom_apprenant,
      formation_cfd: item.formation_cfd,
      uai_etablissement: item.uai_etablissement,
      annee_scolaire: item.annee_scolaire,
    });

    if (!foundItem) {
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
  const dateMiseAJourStatut = new Date(toUpdate.date_metier_mise_a_jour_statut) || new Date();

  // Check if maj statut is valid
  if (isMajStatutInvalid(existingItem.statut_apprenant, toUpdate.statut_apprenant)) {
    toUpdate.statut_mise_a_jour_statut = codesStatutsMajStatutCandidats.ko;
    toUpdate.erreur_mise_a_jour_statut = {
      date_mise_a_jour_statut: dateMiseAJourStatut,
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
        date_statut: dateMiseAJourStatut,
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
  // if statut candidat établissement has a VALID uai try to retrieve information in Referentiel CFAs
  const etablissementInReferentielCfaFromUai =
    validateUai(itemToCreate.uai_etablissement) && (await Cfa.findOne({ uai: itemToCreate.uai_etablissement }));

  // if statut candidat has a valid cfd, check if it exists in db and create it otherwise
  if (validateCfd(itemToCreate.formation_cfd) && !(await existsFormation(itemToCreate.formation_cfd))) {
    await createFormation(itemToCreate.formation_cfd);
  }

  const toAdd = new StatutCandidat({
    ine_apprenant: itemToCreate.ine_apprenant,
    nom_apprenant: itemToCreate.nom_apprenant,
    prenom_apprenant: itemToCreate.prenom_apprenant,
    prenom2_apprenant: itemToCreate.prenom2_apprenant,
    prenom3_apprenant: itemToCreate.prenom3_apprenant,
    ne_pas_solliciter: itemToCreate.ne_pas_solliciter,
    email_contact: itemToCreate.email_contact,
    formation_cfd: itemToCreate.formation_cfd,
    formation_cfd_valid: validateCfd(itemToCreate.formation_cfd),
    libelle_court_formation: itemToCreate.libelle_court_formation,
    libelle_long_formation: itemToCreate.libelle_long_formation,
    niveau_formation: (await getFormationWithCfd(itemToCreate.formation_cfd))?.niveau,
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
    annee_scolaire: itemToCreate.annee_scolaire,

    source: itemToCreate.source,

    // add network of etablissement if found in ReferentielCfa
    ...(etablissementInReferentielCfaFromUai
      ? { etablissement_reseaux: etablissementInReferentielCfaFromUai.reseaux }
      : {}),
  });
  return toAdd.save();
};

const getFindStatutQuery = (
  nom_apprenant = null,
  prenom_apprenant = null,
  formation_cfd,
  uai_etablissement,
  annee_scolaire
) => ({
  nom_apprenant,
  prenom_apprenant,
  formation_cfd,
  uai_etablissement,
  annee_scolaire,
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
const findStatutsDuplicates = async (duplicatesTypesCode, filters = {}, allowDiskUse = false) => {
  let unicityQueryGroup = {};

  switch (duplicatesTypesCode) {
    case duplicatesTypesCodes.unique.code:
      unicityQueryGroup = {
        _id: {
          nom_apprenant: "$nom_apprenant",
          prenom_apprenant: "$prenom_apprenant",
          formation_cfd: "$formation_cfd",
          uai_etablissement: "$uai_etablissement",
          annee_scolaire: "$annee_scolaire",
        },
        // Ajout des ids unique de chaque doublons
        duplicatesIds: { $addToSet: "$_id" },
        etablissement_num_region: { $addToSet: "$etablissement_num_region" },
        count: { $sum: 1 },
      };
      break;

    case duplicatesTypesCodes.formation_cfd.code:
      unicityQueryGroup = {
        _id: {
          nom_apprenant: "$nom_apprenant",
          prenom_apprenant: "$prenom_apprenant",
          uai_etablissement: "$uai_etablissement",
          annee_scolaire: "$annee_scolaire",
        },
        // Ajout des ids unique de chaque doublons
        duplicatesIds: { $addToSet: "$_id" },
        etablissement_num_region: { $addToSet: "$etablissement_num_region" },
        // Ajout des différents formation_cfd en doublon potentiel
        formation_cfds: { $addToSet: "$formation_cfd" },
        count: { $sum: 1 },
      };
      break;

    case duplicatesTypesCodes.prenom_apprenant.code:
      unicityQueryGroup = {
        _id: {
          nom_apprenant: "$nom_apprenant",
          formation_cfd: "$formation_cfd",
          uai_etablissement: "$uai_etablissement",
          annee_scolaire: "$annee_scolaire",
        },
        // Ajout des ids unique de chaque doublons
        duplicatesIds: { $addToSet: "$_id" },
        etablissement_num_region: { $addToSet: "$etablissement_num_region" },
        // Ajout des différentes prenom_apprenant en doublon potentiel
        prenom_apprenants: { $addToSet: "$prenom_apprenant" },
        count: { $sum: 1 },
      };
      break;

    case duplicatesTypesCodes.nom_apprenant.code:
      unicityQueryGroup = {
        _id: {
          prenom_apprenant: "$prenom_apprenant",
          formation_cfd: "$formation_cfd",
          uai_etablissement: "$uai_etablissement",
          annee_scolaire: "$annee_scolaire",
        },
        // Ajout des ids unique de chaque doublons
        duplicatesIds: { $addToSet: "$_id" },
        etablissement_num_region: { $addToSet: "$etablissement_num_region" },
        // Ajout des différents nom_apprenant en doublon potentiel
        nom_apprenants: { $addToSet: "$nom_apprenant" },
        count: { $sum: 1 },
      };
      break;

    default:
      throw new Error("findStatutsDuplicates Error :  duplicatesTypesCode not matching any code");
  }

  const aggregateQuery = [
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
  ];

  const statutsFound = allowDiskUse
    ? await StatutCandidat.aggregate(aggregateQuery).allowDiskUse(true).exec()
    : await StatutCandidat.aggregate(aggregateQuery);

  return statutsFound;
};

/**
 * Construction d'une liste de doublons de type duplicatesTypeCode de statutsCandidats
 * regroupés par UAI pour les filtres passés en paramètres
 * @param {*} duplicatesTypeCode
 * @param {*} filters
 * @param {*} allowDiskUse
 * @returns
 */
const getDuplicatesList = async (duplicatesTypeCode, filters = {}, allowDiskUse = false) => {
  // Récupération des doublons pour le type souhaité
  const duplicates = await findStatutsDuplicates(duplicatesTypeCode, filters, allowDiskUse);

  return duplicates.map((duplicateItem) => {
    const { _id, count, duplicatesIds, ...discriminants } = duplicateItem;
    return {
      commonData: _id,
      duplicatesCount: count,
      duplicatesIds: duplicatesIds,
      discriminants,
    };
  });
};
