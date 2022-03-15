const { DossierApprenantModel, CfaModel } = require("../model");
const omit = require("lodash.omit");
const { duplicatesTypesCodes } = require("../constants/dossierApprenantConstants");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { validateCfd } = require("../domain/cfd");
const { validateSiret } = require("../domain/siret");
const { escapeRegExp } = require("../utils/regexUtils");
const { isEqual } = require("date-fns");
const { existsFormation, createFormation, getFormationWithCfd } = require("./formations")();

module.exports = () => ({
  getDossierApprenant,
  addOrUpdateDossiersApprenants,
  createDossierApprenant,
  updateDossierApprenant,
  getDuplicatesList,
  getDossierApprenantsWithHistoryDateUnordered,
  getDossierApprenantsWithBadDate,
});

const getDossierApprenant = ({ nom_apprenant, prenom_apprenant, formation_cfd, uai_etablissement, annee_scolaire }) => {
  return DossierApprenantModel.findOne({
    nom_apprenant: { $regex: new RegExp(escapeRegExp(nom_apprenant), "i") },
    prenom_apprenant: { $regex: new RegExp(escapeRegExp(prenom_apprenant), "i") },
    formation_cfd,
    uai_etablissement,
    annee_scolaire,
  }).lean();
};

/**
 * Add or update items in a list of DossierApprenant
 * @param {*} itemsToAddOrUpdate
 * @returns
 */
const addOrUpdateDossiersApprenants = async (itemsToAddOrUpdate) => {
  const added = [];
  const updated = [];

  await asyncForEach(itemsToAddOrUpdate, async (item) => {
    let foundItem = await getDossierApprenant({
      nom_apprenant: item.nom_apprenant,
      prenom_apprenant: item.prenom_apprenant,
      formation_cfd: item.formation_cfd,
      uai_etablissement: item.uai_etablissement,
      annee_scolaire: item.annee_scolaire,
    });

    if (!foundItem) {
      const addedItem = await createDossierApprenant(item);
      added.push(addedItem);
    } else {
      const updatedItem = await updateDossierApprenant(foundItem._id, item);
      updated.push(updatedItem);
    }
  });

  return {
    added,
    updated,
  };
};

const updateDossierApprenant = async (existingItemId, toUpdate) => {
  if (!existingItemId) return null;

  // strip unicity criteria because it does not make sense to update them
  const updatePayload = omit(
    toUpdate,
    "prenom_apprenant",
    "nom_apprenant",
    "annee_scolaire",
    "formation_cfd",
    "uai_etablissement"
  );
  const existingItem = await DossierApprenantModel.findById(existingItemId);

  // new statut_apprenant to add ?
  const statutExistsInHistorique = existingItem.historique_statut_apprenant.find((historiqueItem) => {
    return (
      historiqueItem.valeur_statut === toUpdate.statut_apprenant &&
      isEqual(new Date(historiqueItem.date_statut), new Date(toUpdate.date_metier_mise_a_jour_statut))
    );
  });

  if (!statutExistsInHistorique) {
    const newHistoriqueElement = {
      valeur_statut: updatePayload.statut_apprenant,
      date_statut: new Date(updatePayload.date_metier_mise_a_jour_statut),
      date_reception: new Date(),
    };

    // add new element to historique
    const historique = existingItem.historique_statut_apprenant.slice();
    historique.push(newHistoriqueElement);
    // sort historique chronologically
    const historiqueSorted = historique.sort((a, b) => {
      return a.date_statut.getTime() - b.date_statut.getTime();
    });

    // find new element index in sorted historique to remove subsequent ones
    const newElementIndex = historiqueSorted.findIndex((el) => el.date_statut === newHistoriqueElement.date_statut);

    updatePayload.historique_statut_apprenant = historiqueSorted.slice(0, newElementIndex + 1);
    updatePayload.statut_apprenant = newHistoriqueElement.valeur_statut;
  }

  // Update & return
  const updateQuery = {
    ...updatePayload,
    updated_at: new Date(),
  };
  const updated = await DossierApprenantModel.findByIdAndUpdate(existingItemId, updateQuery, { new: true });
  return updated;
};

const createDossierApprenant = async (itemToCreate) => {
  // if dossier apprenant établissement has a VALID uai try to retrieve information in Referentiel CFAs
  const etablissementInReferentielCfaFromUai = await CfaModel.findOne({ uai: itemToCreate.uai_etablissement });

  // if dossier apprenant has a valid cfd, check if it exists in db and create it otherwise
  if (validateCfd(itemToCreate.formation_cfd) && !(await existsFormation(itemToCreate.formation_cfd))) {
    await createFormation(itemToCreate.formation_cfd);
  }

  const formationInfo = await getFormationWithCfd(itemToCreate.formation_cfd);

  const toAdd = new DossierApprenantModel({
    ine_apprenant: itemToCreate.ine_apprenant,
    nom_apprenant: itemToCreate.nom_apprenant.toUpperCase(),
    prenom_apprenant: itemToCreate.prenom_apprenant.toUpperCase(),
    email_contact: itemToCreate.email_contact,
    formation_cfd: itemToCreate.formation_cfd,
    libelle_court_formation: itemToCreate.libelle_court_formation,
    libelle_long_formation: itemToCreate.libelle_long_formation,
    niveau_formation: formationInfo?.niveau,
    niveau_formation_libelle: formationInfo?.niveau_libelle,
    uai_etablissement: itemToCreate.uai_etablissement,
    siret_etablissement: itemToCreate.siret_etablissement,
    siret_etablissement_valid: validateSiret(itemToCreate.siret_etablissement),
    nom_etablissement: itemToCreate.nom_etablissement,
    historique_statut_apprenant: [
      {
        valeur_statut: itemToCreate.statut_apprenant,
        date_statut: new Date(itemToCreate.date_metier_mise_a_jour_statut),
        date_reception: new Date(),
      },
    ],
    periode_formation: itemToCreate.periode_formation,
    annee_formation: itemToCreate.annee_formation,
    annee_scolaire: itemToCreate.annee_scolaire,
    id_erp_apprenant: itemToCreate.id_erp_apprenant,
    tel_apprenant: itemToCreate.tel_apprenant,
    code_commune_insee_apprenant: itemToCreate.code_commune_insee_apprenant,
    date_de_naissance_apprenant: itemToCreate.date_de_naissance_apprenant,
    etablissement_formateur_geo_coordonnees: itemToCreate.etablissement_formateur_geo_coordonnees,
    etablissement_formateur_code_commune_insee: itemToCreate.etablissement_formateur_code_commune_insee,
    contrat_date_debut: itemToCreate.contrat_date_debut,
    contrat_date_fin: itemToCreate.contrat_date_fin,
    contrat_date_rupture: itemToCreate.contrat_date_rupture,
    date_entree_formation: itemToCreate.date_entree_formation,
    formation_rncp: itemToCreate.formation_rncp,

    source: itemToCreate.source,

    // add network of etablissement if found in ReferentielCfa
    ...(etablissementInReferentielCfaFromUai
      ? { etablissement_reseaux: etablissementInReferentielCfaFromUai.reseaux }
      : {}),
  });
  return toAdd.save();
};

/**
 * Récupération de la liste des DossierApprenant en doublons stricts pour les filtres passés en paramètres
 * @param {*} duplicatesTypesCode
 * @param {*} filters
 * @returns
 */
const findDossiersApprenantsDuplicates = async (
  duplicatesTypesCode,
  filters = {},
  { allowDiskUse = false, duplicatesWithNoUpdate = false } = {}
) => {
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
        // ajout des différents statut_apprenant
        statut_apprenants: { $addToSet: "$historique_statut_apprenant.valeur_statut" },
        count: { $sum: 1 },
      };
      break;

    case duplicatesTypesCodes.formation_cfd.code:
      unicityQueryGroup = {
        _id: {
          nom_apprenant: "$nom_apprenant",
          prenom_apprenant: "$prenom_apprenant",
          date_de_naissance_apprenant: "$date_de_naissance_apprenant",
          uai_etablissement: "$uai_etablissement",
          annee_scolaire: "$annee_scolaire",
        },
        // Ajout des ids unique de chaque doublons
        duplicatesIds: { $addToSet: "$_id" },
        etablissement_num_region: { $addToSet: "$etablissement_num_region" },
        // Ajout des différents formation_cfd en doublon potentiel
        formation_cfds: { $addToSet: "$formation_cfd" },
        // ajout des différents statut_apprenant
        statut_apprenants: { $addToSet: "$historique_statut_apprenant.valeur_statut" },
        count: { $sum: 1 },
      };
      break;

    case duplicatesTypesCodes.uai_etablissement.code:
      unicityQueryGroup = {
        _id: {
          nom_apprenant: "$nom_apprenant",
          prenom_apprenant: "$prenom_apprenant",
          date_de_naissance_apprenant: "$date_de_naissance_apprenant",
          formation_cfd: "$formation_cfd",
          annee_scolaire: "$annee_scolaire",
        },
        // Ajout des ids unique de chaque doublons avec date de création
        duplicatesCreatedDatesAndIds: { $addToSet: { id: "$_id", created_at: "$created_at" } },
        // Ajout des différents uais en doublon potentiel
        uais: { $addToSet: "$uai_etablissement" },
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
        // ajout des différents statut_apprenant
        statut_apprenants: { $addToSet: "$historique_statut_apprenant.valeur_statut" },
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
        // ajout des différents statut_apprenant
        statut_apprenants: { $addToSet: "$historique_statut_apprenant.valeur_statut" },
        count: { $sum: 1 },
      };
      break;

    default:
      throw new Error("findDossiersApprenantsDuplicates Error :  duplicatesTypesCode not matching any code");
  }

  if (duplicatesWithNoUpdate) filters.historique_statut_apprenant = { $size: 1 };

  const aggregateQuery = [
    // Filtrage sur les filtres passées en paramètres
    {
      $match: filters,
    },
    // Regroupement sur les critères d'unicité
    {
      $group: unicityQueryGroup,
    },
    // Récupération des DossierApprenant en doublons = regroupement count > 1
    {
      $match: {
        ...(duplicatesWithNoUpdate ? { statut_apprenants: { $size: 1 } } : {}),
        count: { $gt: 1 },
      },
    },
  ];

  const dossiersApprenantsFound = allowDiskUse
    ? await DossierApprenantModel.aggregate(aggregateQuery).allowDiskUse(true).exec()
    : await DossierApprenantModel.aggregate(aggregateQuery);

  return dossiersApprenantsFound;
};

/**
 * Construction d'une liste de doublons de type duplicatesTypeCode de DossierApprenant
 * regroupés par UAI pour les filtres passés en paramètres
 * @param {*} duplicatesTypeCode
 * @param {*} filters
 * @param {*} allowDiskUse
 * @returns
 */
const getDuplicatesList = async (duplicatesTypeCode, filters = {}, options) => {
  // Récupération des doublons pour le type souhaité
  const duplicates = await findDossiersApprenantsDuplicates(duplicatesTypeCode, filters, options);

  return duplicates.map((duplicateItem) => {
    const { _id, count, duplicatesIds, ...discriminants } = duplicateItem;
    return {
      commonData: _id,
      duplicatesCount: count,
      duplicatesIds: duplicatesIds ?? null,
      discriminants,
    };
  });
};

/**
 * Récupération de la liste des DossierApprenant avec un historique antidaté
 * @returns
 */
const getDossierApprenantsWithHistoryDateUnordered = async () => {
  const aggregationPipeline = [
    // Filtrage historique > 1 élement
    { $match: { "historique_statut_apprenant.1": { $exists: true } } },
    // Ajout d'un flag isHistoryDateOrdered - fonction d'identification des historiques avec des dates désordonnées
    {
      $addFields: {
        isHistoryDateOrdered: {
          $function: {
            body: "function(historique_statut_apprenant){return historique_statut_apprenant.slice(1).every((item, i) => historique_statut_apprenant[i].date_statut <= item.date_statut)}",
            args: ["$historique_statut_apprenant"],
            lang: "js",
          },
        },
      },
    },
    // Filtre sur isHistoryDateOrdered = false
    { $match: { isHistoryDateOrdered: false } },
  ];

  const result = await DossierApprenantModel.aggregate(aggregationPipeline);
  return result;
};

/**
 * Récupération de la liste des DossierApprenant ayant une date invalide (< année 2000)
 * @returns
 */
const getDossierApprenantsWithBadDate = async () => {
  const aggregationPipeline = [
    // Filtrage historique > 1 élement
    { $match: { "historique_statut_apprenant.1": { $exists: true } } },
    // Ajout d'un flag hasHistoryBadDate - fonction d'identification des historiques avec date invalide (< année 2000)
    {
      $addFields: {
        hasHistoryBadDate: {
          $function: {
            body: "function(historique_statut_apprenant){return historique_statut_apprenant.some((item) => item.date_statut <= new Date(`2000-01-01`))}",
            args: ["$historique_statut_apprenant"],
            lang: "js",
          },
        },
      },
    },
    // Filtre sur hasHistoryBadDate
    { $match: { hasHistoryBadDate: true } },
  ];

  const result = await DossierApprenantModel.aggregate(aggregationPipeline);
  return result;
};
