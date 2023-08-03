import { ObjectId } from "mongodb";

import { effectifsDb } from "@/common/model/collections";

/**
 * Construction du pipeline d'aggregation du clean des noms / prenom pour identification des doublons
 * @returns
 */
const getSanitizedNomPrenomPipeline = (
  nomApprenantField = "$apprenant.nom",
  prenomApprenantField = "$apprenant.prenom"
) => [
  {
    $addFields: {
      sanitizedNom: { $regexFindAll: { input: { $toLower: nomApprenantField }, regex: /[A-Za-zÀ-ÖØ-öø-ÿ]/ } },
    },
  },
  {
    $addFields: {
      sanitizedPrenom: { $regexFindAll: { input: { $toLower: prenomApprenantField }, regex: /[A-Za-zÀ-ÖØ-öø-ÿ]/ } },
    },
  },
  {
    $addFields: {
      sanitizedNom: {
        $reduce: { input: "$sanitizedNom.match", initialValue: "", in: { $concat: ["$$value", "$$this"] } },
      },
    },
  },
  {
    $addFields: {
      sanitizedPrenom: {
        $reduce: { input: "$sanitizedPrenom.match", initialValue: "", in: { $concat: ["$$value", "$$this"] } },
      },
    },
  },
];

/**
 * Méthode de récupération de la liste des organismes ayant des doublons d'effectifs
 * @param organisme_id
 */
export const getOrganismesHavingDuplicatesEffectifs = async () => {
  return await effectifsDb()
    .aggregate([
      ...getSanitizedNomPrenomPipeline(),
      {
        $group: {
          _id: {
            nom_apprenant: "$sanitizedNom",
            prenom_apprenant: "$sanitizedPrenom",
            date_de_naissance_apprenant: "$apprenant.date_de_naissance",
            annee_scolaire: "$annee_scolaire",
            formation_cfd: "$formation.cfd",
          },
          count: { $sum: 1 },
          organisme_id: { $addToSet: "$organisme_id" },
        },
      },
      { $match: { count: { $gt: 1 } } },
      { $project: { _id: 0, organisme_id: 1 } },
      { $unwind: "$organisme_id" },
      { $group: { _id: "$organisme_id" } }, // Return uniques organismes id
    ])
    .toArray();
};

/**
 * Méthode de récupération de la liste des doublons au sein d'un organisme
 * @param organisme_id
 */
export const getDuplicatesEffectifsForOrganismeId = async (organisme_id: ObjectId) => {
  return await effectifsDb()
    .aggregate([
      { $match: { organisme_id } },
      ...getSanitizedNomPrenomPipeline(),
      {
        $group: {
          _id: {
            nom_apprenant: "$sanitizedNom",
            prenom_apprenant: "$sanitizedPrenom",
            date_de_naissance_apprenant: "$apprenant.date_de_naissance",
            annee_scolaire: "$annee_scolaire",
            formation_cfd: "$formation.cfd",
          },
          count: { $sum: 1 },
          duplicates: { $addToSet: { id: "$_id", created_at: "$created_at" } },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ])
    .toArray();
};

/**
 * Récupération de la liste des doublons pour un SIREN
 * @param siren
 */
export const getEffectifsDuplicatesFromSIREN = async (siren: string) => {
  return await effectifsDb()
    .aggregate([
      {
        $lookup: {
          from: "organismes",
          localField: "organisme_id",
          foreignField: "_id",
          as: "organismes_info",
        },
      },
      { $unwind: "$organismes_info" },
      {
        $project: {
          organisme_uai: "$organismes_info.uai",
          organisme_siren: { $substr: ["$organismes_info.siret", 0, 9] },
          nom_apprenant: "$apprenant.nom",
          prenom_apprenant: "$apprenant.prenom",
          date_de_naissance_apprenant: "$apprenant.date_de_naissance",
          annee_scolaire: "$annee_scolaire",
          formation_cfd: "$formation.cfd",
        },
      },
      { $match: { organisme_siren: siren } },
      ...getSanitizedNomPrenomPipeline("$nom_apprenant", "$prenom_apprenant"),
      {
        $group: {
          _id: {
            nom_apprenant: "$sanitizedNom",
            prenom_apprenant: "$sanitizedPrenom",
            date_de_naissance_apprenant: "$date_de_naissance_apprenant",
            annee_scolaire: "$annee_scolaire",
            formation_cfd: "$formation_cfd",
          },
          count: { $sum: 1 },
          duplicatesIds: { $addToSet: "$_id" },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ])
    .toArray();
};

/**
 * Récupération de la liste des doublons d'effectifs sur la base d'un SIREN commun
 * @returns
 */
export const getEffectifsDuplicatesOnSIREN = async () => {
  return await effectifsDb()
    .aggregate([
      {
        $lookup: {
          from: "organismes",
          localField: "organisme_id",
          foreignField: "_id",
          as: "organismes_info",
        },
      },
      { $unwind: "$organismes_info" },
      {
        $project: {
          organisme_uai: "$organismes_info.uai",
          organisme_siren: { $substr: ["$organismes_info.siret", 0, 9] },
        },
      },
      ...getSanitizedNomPrenomPipeline(),
      {
        $group: {
          _id: {
            organisme_siren: "$organisme_siren",
            nom_apprenant: "$sanitizedNom",
            prenom_apprenant: "$sanitizedPrenom",
            date_de_naissance_apprenant: "$apprenant.date_de_naissance",
            annee_scolaire: "$annee_scolaire",
            formation_cfd: "$formation.cfd",
          },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ])
    .toArray();
};
