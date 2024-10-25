import { ObjectId } from "mongodb";
import { DuplicateEffectifGroup, DuplicateEffectifGroupPagination, getAnneesScolaireListFromDate } from "shared";

import { effectifsDb } from "@/common/model/collections";

/**
 * Construction du pipeline d'aggregation pour l'identification des doublons
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

const getBasePipeline = (organisme_id) => [
  { $match: { organisme_id, annee_scolaire: { $in: getAnneesScolaireListFromDate(new Date()) } } },
  ...getSanitizedNomPrenomPipeline(),
  {
    $group: {
      _id: {
        id_erp_apprenant: "$id_erp_apprenant",
        annee_scolaire: "$annee_scolaire",
      },
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
      firstNomApprenant: { $first: "$apprenant.nom" },
      firstPrenomApprenant: { $first: "$apprenant.prenom" },
    },
  },
  { $sort: { firstNomApprenant: 1, firstPrenomApprenant: 1 } },
  { $match: { count: { $gt: 1 } } },
];

/**
 * Méthode de récupération de la liste des doublons au sein d'un organisme
 *
 * @param organisme_id L'identifiant unique de l'organisme pour laquelle rechercher des doublons.
 */
const getDuplicatesEffectifsForOrganismeId = async (organisme_id: ObjectId): Promise<DuplicateEffectifGroup[]> => {
  const basePipeline = getBasePipeline(organisme_id);

  const duplicates = (await effectifsDb().aggregate(basePipeline).toArray()) as DuplicateEffectifGroup[];
  return duplicates;
};

/**
 * Méthode de récupération de la liste des doublons au sein d'un organisme avec pagination
 *
 * @param organisme_id L'identifiant unique de l'organisme pour laquelle rechercher des doublons.
 * @param page (Optionnel) Le numéro de la page pour la pagination.
 * @param limit (Optionnel) Le nombre d'enregistrements par page pour la pagination. Requis si `page` est spécifié.
 * @returns Une promesse résolue soit avec un tableau de `PaginationResult` contenant des doublons paginés et un total.
 */
export const getDuplicatesEffectifsForOrganismeIdWithPagination = async (
  organisme_id: ObjectId,
  page: number,
  limit: number
): Promise<DuplicateEffectifGroupPagination> => {
  const basePipeline = getBasePipeline(organisme_id);
  const paginationPipeline = [
    ...basePipeline,
    {
      $facet: {
        totalItems: [{ $count: "total" }],
        paginatedResults: [{ $skip: (page - 1) * limit }, { $limit: limit }],
      },
    },
  ];

  const result = await effectifsDb().aggregate(paginationPipeline).toArray();

  const totalItems = result[0].totalItems[0] ? result[0].totalItems[0].total : 0;
  const duplicates = result[0].paginatedResults as DuplicateEffectifGroup[];

  return {
    totalItems,
    data: duplicates,
  };
};

export const deleteOldestDuplicates = async (organisme_id: ObjectId): Promise<void> => {
  try {
    const result = await getDuplicatesEffectifsForOrganismeId(organisme_id);
    let idsToDelete: ObjectId[] = [];

    if (!Array.isArray(result)) {
      throw new Error("Doublons attendus sans pagination");
    }

    const duplicates = result;

    duplicates.forEach((duplicateGroup: DuplicateEffectifGroup) => {
      if (duplicateGroup.duplicates.length > 1) {
        const sortedDuplicates = duplicateGroup.duplicates.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        const olderDuplicates = sortedDuplicates.slice(0, -1);
        idsToDelete.push(...olderDuplicates.map((duplicate) => new ObjectId(duplicate.id)));
      }
    });

    await effectifsDb().deleteMany({ _id: { $in: idsToDelete } });
  } catch (error) {
    console.error("Une erreur s'est produite lors du processus de suppression :", error);
  }
};
