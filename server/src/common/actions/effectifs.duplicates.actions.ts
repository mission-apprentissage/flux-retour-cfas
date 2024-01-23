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
      sanitizedNom: {
        $regexFindAll: { input: { $toLower: nomApprenantField }, regex: /[A-Za-zÀ-ÖØ-öø-ÿ]/ },
      },
      sanitizedPrenom: {
        $regexFindAll: { input: { $toLower: prenomApprenantField }, regex: /[A-Za-zÀ-ÖØ-öø-ÿ]/ },
      },
    },
  },
  {
    $addFields: {
      sanitizedNom: {
        $reduce: { input: "$sanitizedNom.match", initialValue: "", in: { $concat: ["$$value", "$$this"] } },
      },
      sanitizedPrenom: {
        $reduce: { input: "$sanitizedPrenom.match", initialValue: "", in: { $concat: ["$$value", "$$this"] } },
      },
    },
  },
];

/**
 * Méthode de récupération de la liste des doublons au sein d'un organisme avec ou sans CFD
 * @param organisme_id
 * @param include_formation_cfd
 */
export const getDuplicatesEffectifsForOrganismeId = async (
  organisme_id: ObjectId,
  include_formation_cfd: boolean = true
) => {
  const groupStageId = {
    nom_apprenant: "$sanitizedNom",
    prenom_apprenant: "$sanitizedPrenom",
    date_de_naissance_apprenant: "$apprenant.date_de_naissance",
    annee_scolaire: "$annee_scolaire",
    ...(include_formation_cfd && { formation_cfd: "$formation.cfd" }),
  };

  return await effectifsDb()
    .aggregate([
      { $match: { organisme_id, annee_scolaire: { $in: getAnneesScolaireListFromDate(new Date()) } } },
      ...getSanitizedNomPrenomPipeline(),
      {
        $group: {
          _id: groupStageId,
          count: { $sum: 1 },
          duplicates: {
            $addToSet: {
              id: "$_id",
              created_at: "$created_at",
              updated_at: "$updated_at",
              source: "$source",
              apprenant: "$apprenant",
              formation: "$formation",
              contrats: "$contrats",
              historique_statut: "$historique_statut",
              id_erp_apprenant: "$id_erp_apprenant",
              annee_scolaire: "$annee_scolaire",
            },
          },
        },
      },
      { $sort: { "_id.nom_apprenant": 1, "_id.prenom_apprenant": 1 } },
      { $match: { count: { $gt: 1 } } },
    ])
    .toArray();
};
