const { ObjectId } = require("mongodb");
const omit = require("lodash.omit");
const { DUPLICATE_TYPE_CODES } = require("../constants/dossierApprenantConstants");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { escapeRegExp } = require("../utils/regexUtils");
const { isEqual } = require("date-fns");
const { DossierApprenant } = require("../factory/dossierApprenant");
const { cfasDb, dossiersApprenantsDb } = require("../model/collections");

module.exports = () => ({
  getDossierApprenant,
  addOrUpdateDossiersApprenants,
  createDossierApprenant,
  updateDossierApprenant,
  getDuplicatesList,
});

/**
 * Find a dossier apprenant from unicity key params
 * @param {*} unicityFields
 * @returns
 */
const getDossierApprenant = ({
  nom_apprenant,
  prenom_apprenant,
  date_de_naissance_apprenant,
  formation_cfd,
  uai_etablissement,
  annee_scolaire,
}) => {
  const nomApprenantRegexp = new RegExp("^" + escapeRegExp(nom_apprenant.trim()) + "$", "i");
  const prenomApprenantRegexp = new RegExp("^" + escapeRegExp(prenom_apprenant.trim()) + "$", "i");

  return dossiersApprenantsDb().findOne({
    nom_apprenant: { $regex: nomApprenantRegexp },
    prenom_apprenant: { $regex: prenomApprenantRegexp },
    date_de_naissance_apprenant,
    formation_cfd,
    uai_etablissement,
    annee_scolaire,
  });
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
    // Search dossier with unicity fields
    let foundItem = await getDossierApprenant({
      nom_apprenant: item.nom_apprenant,
      prenom_apprenant: item.prenom_apprenant,
      date_de_naissance_apprenant: item.date_de_naissance_apprenant,
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
  let updatePayload = omit(
    toUpdate,
    "nom_apprenant",
    "prenom_apprenant",
    "date_de_naissance_apprenant",
    "formation_cfd",
    "uai_etablissement",
    "annee_scolaire"
  );
  const _id = new ObjectId(existingItemId);
  if (!ObjectId.isValid(_id)) throw new Error("Invalid id passed");
  const existingItem = await dossiersApprenantsDb().findOne({ _id });

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
  await dossiersApprenantsDb().updateOne({ _id }, { $set: updateQuery });
  // TODO return nothing (single responsibility)
  return await dossiersApprenantsDb().findOne({ _id });
};

const createDossierApprenant = async (itemToCreate) => {
  // if dossier apprenant établissement has a VALID uai try to retrieve information in Referentiel CFAs
  const etablissementInReferentielCfaFromUai = await cfasDb().findOne({ uai: itemToCreate.uai_etablissement });

  const dossierApprenantEntity = DossierApprenant.create({
    ine_apprenant: itemToCreate.ine_apprenant,
    nom_apprenant: itemToCreate.nom_apprenant.toUpperCase(),
    prenom_apprenant: itemToCreate.prenom_apprenant.toUpperCase(),
    email_contact: itemToCreate.email_contact,
    formation_cfd: itemToCreate.formation_cfd,
    libelle_long_formation: itemToCreate.libelle_long_formation,
    uai_etablissement: itemToCreate.uai_etablissement,
    siret_etablissement: itemToCreate.siret_etablissement,
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
    contrat_date_debut: itemToCreate.contrat_date_debut,
    contrat_date_fin: itemToCreate.contrat_date_fin,
    contrat_date_rupture: itemToCreate.contrat_date_rupture,
    formation_rncp: itemToCreate.formation_rncp,
    source: itemToCreate.source,
    // add network of etablissement if found in ReferentielCfa
    ...(etablissementInReferentielCfaFromUai
      ? { etablissement_reseaux: etablissementInReferentielCfaFromUai.reseaux }
      : {}),
  });

  if (dossierApprenantEntity) {
    const { insertedId } = await dossiersApprenantsDb().insertOne(dossierApprenantEntity);
    // TODO return only the insertedId (single responsiblity)
    return await dossiersApprenantsDb().findOne({ _id: insertedId });
  }

  // TODO throw error if factory validation didn't pass
  return null;
};

// TODO not used anymore, to remove?
/**
 * Récupération de la liste des DossierApprenant en doublons stricts pour les filtres passés en paramètres
 * @param {*} duplicatesTypesCode
 * @param {*} filters
 * @returns
 */
const findDossiersApprenantsDuplicates = async (
  duplicatesTypesCode,
  filters = {},
  { duplicatesWithNoUpdate = false } = {}
) => {
  let unicityQueryGroup = {};

  switch (duplicatesTypesCode) {
    case DUPLICATE_TYPE_CODES.unique.code:
      unicityQueryGroup = {
        _id: {
          nom_apprenant: "$nom_apprenant",
          prenom_apprenant: "$prenom_apprenant",
          date_de_naissance_apprenant: "$date_de_naissance_apprenant",
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

    case DUPLICATE_TYPE_CODES.formation_cfd.code:
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

    case DUPLICATE_TYPE_CODES.uai_etablissement.code:
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

    case DUPLICATE_TYPE_CODES.prenom_apprenant.code:
      unicityQueryGroup = {
        _id: {
          nom_apprenant: "$nom_apprenant",
          date_de_naissance_apprenant: "$date_de_naissance_apprenant",
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

    case DUPLICATE_TYPE_CODES.nom_apprenant.code:
      unicityQueryGroup = {
        _id: {
          prenom_apprenant: "$prenom_apprenant",
          date_de_naissance_apprenant: "$date_de_naissance_apprenant",
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

  const dossiersApprenantsFound = await dossiersApprenantsDb().aggregate(aggregateQuery).toArray();

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
