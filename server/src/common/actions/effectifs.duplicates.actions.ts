import * as Boom from "@hapi/boom";
import { ObjectId } from "mongodb";
import {
  DuplicateEffectifGroup,
  DuplicateEffectifGroupPagination,
  getAnneesScolaireListFromDate,
  MOTIF_SUPPRESSION,
  SOURCE_APPRENANT,
} from "shared";
import type { IEffectif } from "shared/models/data/effectifs.model";

import { softDeleteEffectif } from "@/common/actions/effectifs.actions";
import logger from "@/common/logger";
import { effectifsDb } from "@/common/model/collections";
import { repointerLiensVersJumeau, resultatRepointageVide } from "@/jobs/effectifs/repointer-liens";

const LETTRES_ACCENTUEES: [string, string][] = Object.entries({
  a: "àâäáãåÀÂÄÁÃÅ",
  c: "çÇ",
  e: "èéêëÈÉÊË",
  i: "ìíîïÌÍÎÏ",
  n: "ñÑ",
  o: "òóôöõøÒÓÔÖÕØ",
  u: "ùúûüÙÚÛÜ",
  y: "ýÿÝŸ",
  ae: "æÆ",
  oe: "œŒ",
}).flatMap(([base, variantes]) => [...variantes].map((variante): [string, string] => [variante, base]));

const lettresNormalisees = (champ: string) => ({
  $reduce: {
    input: {
      $regexFindAll: {
        input: {
          $toLower: {
            $reduce: {
              input: LETTRES_ACCENTUEES,
              initialValue: { $ifNull: [champ, ""] },
              in: {
                $replaceAll: {
                  input: "$$value",
                  find: { $arrayElemAt: ["$$this", 0] },
                  replacement: { $arrayElemAt: ["$$this", 1] },
                },
              },
            },
          },
        },
        regex: /[a-z]/,
      },
    },
    initialValue: "",
    in: { $concat: ["$$value", "$$this.match"] },
  },
});

const getBasePipeline = (organisme_id: ObjectId) => [
  {
    $match: {
      organisme_id,
      annee_scolaire: { $in: getAnneesScolaireListFromDate(new Date()) },
      "apprenant.date_de_naissance": { $type: "date" },
    },
  },
  {
    $addFields: {
      nomNormalise: lettresNormalisees("$apprenant.nom"),
      prenomNormalise: lettresNormalisees("$apprenant.prenom"),
    },
  },
  { $match: { nomNormalise: { $ne: "" }, prenomNormalise: { $ne: "" } } },
  {
    $group: {
      _id: {
        annee_scolaire: "$annee_scolaire",
        nom: "$nomNormalise",
        prenom: "$prenomNormalise",
        date_de_naissance: "$apprenant.date_de_naissance",
      },
      count: { $sum: 1 },
      duplicates: {
        $push: {
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
          statut: "$_computed.statut",
        },
      },
      firstNomApprenant: { $first: "$apprenant.nom" },
      firstPrenomApprenant: { $first: "$apprenant.prenom" },
    },
  },
  {
    $addFields: {
      duplicates: {
        $sortArray: { input: "$duplicates", sortBy: { updated_at: -1 } },
      },
    },
  },
  { $match: { count: { $gt: 1 } } },
  { $sort: { firstNomApprenant: 1, firstPrenomApprenant: 1 } },
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

const dateDe = (valeur: Date | string | null | undefined) => (valeur ? new Date(valeur).getTime() : 0);

function choisirEffectifAGarder<
  T extends { source?: string | null; updated_at?: Date | string | null; created_at?: Date | string | null },
>(effectifs: T[]): T {
  return [...effectifs].sort((a, b) => {
    const erpA = a.source === SOURCE_APPRENANT.FICHIER ? 1 : 0;
    const erpB = b.source === SOURCE_APPRENANT.FICHIER ? 1 : 0;
    if (erpA !== erpB) {
      return erpA - erpB;
    }
    return dateDe(b.updated_at ?? b.created_at) - dateDe(a.updated_at ?? a.created_at);
  })[0];
}

async function archiverAuProfitDe(
  effectifId: ObjectId,
  jumeau: IEffectif,
  userId: ObjectId | null
): Promise<"supprime" | "refuse"> {
  const repointage = await repointerLiensVersJumeau(effectifId, jumeau, resultatRepointageVide());
  if (repointage.ml.refuses > 0) {
    logger.warn({ effectifId, jumeauId: jumeau._id }, "doublon conservé : dossier Mission Locale non reportable");
    return "refuse";
  }
  await softDeleteEffectif(effectifId, userId, {
    motif: MOTIF_SUPPRESSION.Doublon,
    description: `Doublon de l'effectif ${jumeau._id.toString()}`,
  });
  return "supprime";
}

export type ResultatSuppressionDoublons = { supprimes: number; refuses: number };

export async function supprimerDoublonsEnLot(
  organisme_id: ObjectId,
  userId: ObjectId | null
): Promise<ResultatSuppressionDoublons> {
  const groupes = await getDuplicatesEffectifsForOrganismeId(organisme_id);
  const resultat: ResultatSuppressionDoublons = { supprimes: 0, refuses: 0 };
  for (const groupe of groupes) {
    const garde = choisirEffectifAGarder(groupe.duplicates);
    const jumeau = await effectifsDb().findOne({ _id: new ObjectId(garde.id) });
    if (!jumeau) {
      continue;
    }
    for (const doublon of groupe.duplicates.filter(({ id }) => String(id) !== String(garde.id))) {
      resultat[
        (await archiverAuProfitDe(new ObjectId(doublon.id), jumeau, userId)) === "supprime" ? "supprimes" : "refuses"
      ]++;
    }
  }
  return resultat;
}

export async function supprimerDoublon(effectifId: ObjectId, userId: ObjectId | null): Promise<void> {
  const effectif = await effectifsDb().findOne({ _id: effectifId });
  if (!effectif) {
    throw Boom.notFound("Effectif introuvable");
  }
  const groupe = (await getDuplicatesEffectifsForOrganismeId(effectif.organisme_id)).find(({ duplicates }) =>
    duplicates.some(({ id }) => String(id) === effectifId.toString())
  );
  const autres = groupe?.duplicates.filter(({ id }) => String(id) !== effectifId.toString()) ?? [];
  if (autres.length === 0) {
    throw Boom.conflict("Cet effectif n'a pas de doublon : il n'a pas été supprimé.");
  }
  const jumeau = await effectifsDb().findOne({ _id: new ObjectId(choisirEffectifAGarder(autres).id) });
  if (!jumeau) {
    throw Boom.conflict("Cet effectif n'a pas de doublon : il n'a pas été supprimé.");
  }
  if ((await archiverAuProfitDe(effectifId, jumeau, userId)) === "refuse") {
    throw Boom.conflict(
      "Son dossier Mission Locale ne peut pas être reporté sur son doublon : l'effectif n'a pas été supprimé."
    );
  }
}
