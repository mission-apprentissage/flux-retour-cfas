import { ObjectId } from "mongodb";

import { effectifsDb } from "@/common/model/collections";

/**
 * Méthode de récupération de la liste des doublons au sein d'un organisme
 * @param organisme_id
 */
export const getDuplicatesEffectifsForOrganismeId = async (organisme_id: ObjectId) => {
  return await effectifsDb()
    .aggregate([
      { $match: { organisme_id } },
      {
        $addFields: {
          sanitizedNom: { $regexFindAll: { input: { $toLower: "$apprenant.nom" }, regex: /[A-Za-zÀ-ÖØ-öø-ÿ]/ } },
        },
      },
      {
        $addFields: {
          sanitizedPrenom: { $regexFindAll: { input: { $toLower: "$apprenant.prenom" }, regex: /[A-Za-zÀ-ÖØ-öø-ÿ]/ } },
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
          duplicatesIds: { $addToSet: "$_id" },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ])
    .toArray();
};

/**
 * TODO : Clean
 * Récupération de la liste des doublons pour un SIREN
 * @param siren
 */
export const getEffectifsDuplicatesFromSIREN = async (siren: string) => {
  const sample = await effectifsDb()
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
          nom_apprenant: { $toUpper: "$sanitizedName" },
          prenom_apprenant: { $toUpper: "$apprenant.prenom" },
          date_de_naissance_apprenant: "$apprenant.date_de_naissance",
          annee_scolaire: "$annee_scolaire",
        },
      },
      { $match: { organisme_siren: "786384263" } },
    ])
    .toArray();

  console.log(sample);

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
      { $match: { organisme_siren: siren } },
      {
        $group: {
          _id: {
            nom_apprenant: "$apprenant.nom",
            prenom_apprenant: { $toLower: "$apprenant.prenom" },
            date_de_naissance_apprenant: "$apprenant.date_de_naissance",
            annee_scolaire: "$annee_scolaire",
          },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ])
    .toArray();
};

/**
 * TODO : Clean
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
      {
        $group: {
          _id: {
            organisme_siren: "$organisme_siren",
            nom_apprenant: "$apprenant.nom",
            prenom_apprenant: "$apprenant.prenom",
            date_de_naissance_apprenant: "$apprenant.date_de_naissance",
            annee_scolaire: "$annee_scolaire",
          },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ])
    .toArray();
};

/**
 * TODO : Clean
 * @returns
 */
export const tmpSanitized = async () => {
  const sanitizedTest = await effectifsDb().aggregate([
    {
      $addFields: {
        sanitizedNom: { $regexFindAll: { input: { $toUpper: "$apprenant.nom" }, regex: /[A-Za-zÀ-ÖØ-öø-ÿ]/ } },
      },
    },
    {
      $addFields: {
        sanitizedPrenom: { $regexFindAll: { input: { $toUpper: "$apprenant.prenom" }, regex: /[A-Za-zÀ-ÖØ-öø-ÿ]/ } },
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
  ]);

  return sanitizedTest;
};
