import { PromisePool } from "@supercharge/promise-pool";
import { ObjectId } from "mongodb";

import { effectifsDb, effectifsDuplicatesGroupDb } from "@/common/model/collections";
import {
  defaultValuesEffectifDuplicate,
  defaultValuesEffectifDuplicatesGroup,
} from "@/common/model/effectifsDuplicatesGroup.model";

/**
 * Méthode d'ajout à la collection des doublons d'effectifs de tous les doublons identifiés pour l'organisme spécifié
 * @param organisme_id
 */
export const buildEffectifsDuplicatesForOrganismeId = async (organisme_id: ObjectId) => {
  const duplicatesForOrganisme = await getDuplicatesEffectifsForOrganismeId(organisme_id);

  // Pour chaque doublon on ajoute le groupe en base
  await PromisePool.for(duplicatesForOrganisme).process(async (currentDuplicate) => {
    await effectifsDuplicatesGroupDb().insertOne({
      ...defaultValuesEffectifDuplicatesGroup(),
      organisme_id,
      duplicatesEffectifs: currentDuplicate.duplicatesIds.map((item) => ({
        ...defaultValuesEffectifDuplicate(),
        _id: item,
      })),
    });
  });
};

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

/**
 * Mise à jour du statut d'un goupe de doublon
 * @param _id
 * @param toUpdateStatut
 * @returns
 */
export const updateDuplicateGroupStatut = async (organisme_id, duplicateEffectifId, toUpdateStatut) => {
  const updated = await effectifsDuplicatesGroupDb().findOneAndUpdate(
    { organisme_id, "duplicatesEffectifs._id": duplicateEffectifId },
    { $set: { "duplicatesEffectifs.$.statut": toUpdateStatut, updated_at: new Date() } },
    { returnDocument: "after" }
  );

  return updated.value;
};
