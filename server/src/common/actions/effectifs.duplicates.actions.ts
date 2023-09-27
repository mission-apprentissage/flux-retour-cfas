import { ObjectId } from "mongodb";
import { getAnneesScolaireListFromDate } from "shared";

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
 * Méthode de récupération de la liste des doublons au sein d'un organisme
 * @param organisme_id
 */
export const getDuplicatesEffectifsForOrganismeId = async (organisme_id: ObjectId) => {
  return await effectifsDb()
    .aggregate([
      { $match: { organisme_id, annee_scolaire: { $in: getAnneesScolaireListFromDate(new Date()) } } },
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
          duplicates: { $addToSet: { id: "$_id", created_at: "$created_at", source: "$source" } },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ])
    .toArray();
};
