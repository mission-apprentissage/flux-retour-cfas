import * as Boom from "@hapi/boom";
import { ObjectId } from "mongodb";
import {
  DuplicateEffectifGroup,
  DuplicateEffectifGroupPagination,
  getActiveAnneesScolaires,
  getAnneesScolaireListFromDate,
  MOTIF_SUPPRESSION,
  SOURCE_APPRENANT,
} from "shared";
import type { IEffectif } from "shared/models/data/effectifs.model";

import { softDeleteEffectif } from "@/common/actions/effectifs.actions";
import { createOrUpdateMissionLocaleStats } from "@/common/actions/mission-locale/mission-locale-stats.actions";
import logger from "@/common/logger";
import { effectifsDb } from "@/common/model/collections";
import { dateMetierExpr, dedupNomExpr } from "@/common/utils/mongoUtils";
import { repointerLiensVersJumeau, resultatRepointageVide } from "@/jobs/effectifs/repointer-liens";

const anneesDeDetection = (date: Date) => [
  ...new Set([...getAnneesScolaireListFromDate(date), ...getActiveAnneesScolaires(date)]),
];

const getBasePipeline = (organisme_id: ObjectId) => [
  {
    $match: {
      organisme_id,
      annee_scolaire: { $in: anneesDeDetection(new Date()) },
      "apprenant.date_de_naissance": { $type: "date" },
    },
  },
  {
    $addFields: {
      nomNormalise: dedupNomExpr("$apprenant.nom"),
      prenomNormalise: dedupNomExpr("$apprenant.prenom"),
      dateDeNaissanceNormalisee: dateMetierExpr("$apprenant.date_de_naissance"),
    },
  },
  { $match: { nomNormalise: { $ne: "" }, prenomNormalise: { $ne: "" } } },
  {
    $group: {
      _id: {
        annee_scolaire: "$annee_scolaire",
        nom: "$nomNormalise",
        prenom: "$prenomNormalise",
        date_de_naissance: "$dateDeNaissanceNormalisee",
      },
      count: { $sum: 1 },
      duplicates: {
        $push: {
          id: "$_id",
          created_at: "$created_at",
          updated_at: "$updated_at",
          transmitted_at: "$transmitted_at",
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
        $sortArray: { input: "$duplicates", sortBy: { transmitted_at: -1, updated_at: -1 } },
      },
    },
  },
  { $match: { count: { $gt: 1 } } },
  { $sort: { firstNomApprenant: 1, firstPrenomApprenant: 1, _id: 1 } },
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

type DateTriable = Date | string | null | undefined;

function choisirEffectifAGarder<
  T extends {
    source?: string | null;
    transmitted_at?: DateTriable;
    updated_at?: DateTriable;
    created_at?: DateTriable;
  },
>(effectifs: T[]): T {
  return [...effectifs].sort((a, b) => {
    const erpA = a.source === SOURCE_APPRENANT.FICHIER ? 1 : 0;
    const erpB = b.source === SOURCE_APPRENANT.FICHIER ? 1 : 0;
    if (erpA !== erpB) {
      return erpA - erpB;
    }
    const transmission = dateDe(b.transmitted_at) - dateDe(a.transmitted_at);
    if (transmission !== 0) {
      return transmission;
    }
    return dateDe(b.updated_at ?? b.created_at) - dateDe(a.updated_at ?? a.created_at);
  })[0];
}

const existeEncore = async (effectifId: ObjectId) =>
  !!(await effectifsDb().findOne({ _id: effectifId }, { projection: { _id: 1 } }));

async function archiverAuProfitDe(
  effectifId: ObjectId,
  jumeau: IEffectif,
  userId: ObjectId | null,
  missionsLocales: Map<string, ObjectId>
): Promise<"supprime" | "refuse"> {
  if (!(await existeEncore(jumeau._id)) || !(await existeEncore(effectifId))) {
    return "refuse";
  }
  const repointage = await repointerLiensVersJumeau(effectifId, jumeau, resultatRepointageVide());
  repointage.missions_locales.forEach((id) => missionsLocales.set(id.toString(), id));
  if (repointage.ml.refuses > 0) {
    logger.warn({ effectifId, jumeauId: jumeau._id }, "doublon conservé : dossier Mission Locale non reportable");
    return "refuse";
  }
  if (!(await existeEncore(jumeau._id))) {
    logger.warn({ effectifId, jumeauId: jumeau._id }, "doublon conservé : son jumeau a été supprimé entre-temps");
    return "refuse";
  }
  await softDeleteEffectif(effectifId, userId, {
    motif: MOTIF_SUPPRESSION.Doublon,
    description: `Doublon de l'effectif ${jumeau._id.toString()}`,
  });
  return "supprime";
}

async function rafraichirStatsMissionsLocales(missionsLocales: Map<string, ObjectId>) {
  for (const missionLocaleId of missionsLocales.values()) {
    try {
      await createOrUpdateMissionLocaleStats(missionLocaleId);
    } catch (err) {
      logger.warn({ err, mission_locale_id: missionLocaleId }, "Stats de la Mission Locale non rafraîchies");
    }
  }
}

export type ResultatSuppressionDoublons = { supprimes: number; refuses: number };

export async function supprimerDoublonsEnLot(
  organisme_id: ObjectId,
  userId: ObjectId | null
): Promise<ResultatSuppressionDoublons> {
  const groupes = await getDuplicatesEffectifsForOrganismeId(organisme_id);
  const resultat: ResultatSuppressionDoublons = { supprimes: 0, refuses: 0 };
  const missionsLocales = new Map<string, ObjectId>();
  for (const groupe of groupes) {
    const garde = choisirEffectifAGarder(groupe.duplicates);
    const jumeau = await effectifsDb().findOne({ _id: new ObjectId(garde.id) });
    if (!jumeau) {
      continue;
    }
    for (const doublon of groupe.duplicates.filter(({ id }) => String(id) !== String(garde.id))) {
      try {
        const issue = await archiverAuProfitDe(new ObjectId(doublon.id), jumeau, userId, missionsLocales);
        resultat[issue === "supprime" ? "supprimes" : "refuses"]++;
      } catch (err) {
        logger.error({ err, effectifId: doublon.id, jumeauId: jumeau._id }, "doublon conservé : suppression en erreur");
        resultat.refuses++;
      }
    }
  }
  await rafraichirStatsMissionsLocales(missionsLocales);
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
  const missionsLocales = new Map<string, ObjectId>();
  const issue = await archiverAuProfitDe(effectifId, jumeau, userId, missionsLocales);
  await rafraichirStatsMissionsLocales(missionsLocales);
  if (issue === "refuse") {
    throw Boom.conflict(
      "Son dossier Mission Locale ne peut pas être reporté sur son doublon : l'effectif n'a pas été supprimé."
    );
  }
}
