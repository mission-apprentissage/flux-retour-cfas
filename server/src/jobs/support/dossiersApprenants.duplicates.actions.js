import { dossiersApprenantsDb } from "../../common/model/collections.js";

/**
 * Code pour les types de doublons identifiables
 */
export const DUPLICATE_TYPE_CODES = {
  unique: {
    name: "Uniques (clé d'unicité identique)",
    code: 1,
  },
  formation_cfd: {
    name: "CFDs",
    code: 2,
  },
  prenom_apprenant: {
    name: "Prenom",
    code: 3,
  },
  nom_apprenant: {
    name: "Nom",
    code: 4,
  },
  uai_etablissement: {
    name: "Uai",
    code: 5,
  },
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
export const getDuplicatesList = async (duplicatesTypeCode, filters = {}, options) => {
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
