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
      {
        $addFields: {
          sanitizedNom: { $regexFindAll: { input: { $toLower: "$nom_apprenant" }, regex: /[A-Za-zÀ-ÖØ-öø-ÿ]/ } },
        },
      },
      {
        $addFields: {
          sanitizedPrenom: { $regexFindAll: { input: { $toLower: "$prenom_apprenant" }, regex: /[A-Za-zÀ-ÖØ-öø-ÿ]/ } },
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
