import { ObjectId } from "bson";
import { STATUT_APPRENANT } from "shared/constants";
import { IOrganisationOrganismeFormation } from "shared/models";
import {
  CFA_COLLAB_STATUS,
  CfaRuptureSegmentKey,
  ICfaRuptureEffectif,
  ICfaRuptureSegment,
} from "shared/models/routes/organismes/cfa";
import { getAnneeScolaireListFromDateRange } from "shared/utils";

import { missionLocaleEffectifsDb } from "@/common/model/collections";

import {
  DATE_START_RUPTURES,
  buildEffRuptureAgeFilter,
  createDernierStatutFieldPipeline,
} from "../shared/rupture-pipeline.utils";

const SEGMENT_ORDER: CfaRuptureSegmentKey[] = ["moins_45j", "46_90j", "91_180j"];

function buildCfaOrganismeMatchStages(organisation: IOrganisationOrganismeFormation, isAllowedDeca: boolean) {
  if (!organisation.organisme_id) {
    throw new Error("organisme_id is required");
  }
  const organismeId = new ObjectId(organisation.organisme_id);

  const stages: Record<string, unknown>[] = [
    {
      $match: {
        "effectif_snapshot.organisme_id": organismeId,
      },
    },
  ];

  if (!isAllowedDeca) {
    stages.push({
      $match: { "effectif_snapshot.is_deca_compatible": { $exists: false } },
    });
  }

  stages.push({
    $match: {
      "effectif_snapshot.annee_scolaire": { $in: getAnneeScolaireListFromDateRange(DATE_START_RUPTURES, new Date()) },
    },
  });

  return stages;
}

export async function getCfaEffectifsEnRupture(
  organisation: IOrganisationOrganismeFormation,
  isAllowedDeca: boolean
): Promise<ICfaRuptureSegment[]> {
  const now = new Date();
  const pipeline = [
    ...buildCfaOrganismeMatchStages(organisation, isAllowedDeca),
    ...buildEffRuptureAgeFilter(),
    // Normalize date_rupture: use cfa_rupture_declaration.date_rupture as fallback
    {
      $addFields: {
        date_rupture: {
          $ifNull: ["$date_rupture", "$cfa_rupture_declaration.date_rupture"],
        },
      },
    },
    ...createDernierStatutFieldPipeline(),
    // Include both system-detected ruptures AND CFA-declared ruptures
    {
      $match: {
        $or: [
          {
            "effectif_snapshot._computed.statut.en_cours": STATUT_APPRENANT.RUPTURANT,
            date_rupture: { $lte: now },
          },
          {
            cfa_rupture_declaration: { $exists: true },
          },
        ],
      },
    },
    { $match: { dernierStatutDureeInDay: { $lte: 180 } } },
    // Exclude effectifs who have since become APPRENTI again,
    // but only for system-detected ruptures (not CFA manual declarations,
    // where the ERP may not have updated the status yet)
    {
      $match: {
        $or: [
          { cfa_rupture_declaration: { $exists: true } },
          { "current_status.value": { $ne: STATUT_APPRENANT.APPRENTI } },
        ],
      },
    },
    {
      $addFields: {
        collab_status: {
          $switch: {
            branches: [
              {
                case: {
                  $and: [
                    { $ne: [{ $ifNull: ["$situation", null] }, null] },
                    { $ne: ["$situation", "CONTACTE_SANS_RETOUR"] },
                  ],
                },
                then: CFA_COLLAB_STATUS.TRAITE_PAR_ML,
              },
              {
                case: { $eq: ["$situation", "CONTACTE_SANS_RETOUR"] },
                then: CFA_COLLAB_STATUS.CONTACTE_PAR_ML,
              },
              {
                case: { $eq: ["$organisme_data.acc_conjoint", true] },
                then: CFA_COLLAB_STATUS.COLLAB_DEMANDEE,
              },
            ],
            default: CFA_COLLAB_STATUS.DEMARRER_COLLAB,
          },
        },
        segment: {
          $switch: {
            branches: [
              { case: { $lte: ["$dernierStatutDureeInDay", 45] }, then: "moins_45j" },
              { case: { $lte: ["$dernierStatutDureeInDay", 90] }, then: "46_90j" },
            ],
            default: "91_180j",
          },
        },
      },
    },

    { $sort: { date_rupture: -1 as const } },
    {
      $group: {
        _id: "$segment",
        effectifs: {
          $push: {
            id: "$effectif_snapshot._id",
            nom: { $ifNull: ["$identifiant_normalise.nom", "$effectif_snapshot.apprenant.nom"] },
            prenom: { $ifNull: ["$identifiant_normalise.prenom", "$effectif_snapshot.apprenant.prenom"] },
            date_rupture: "$date_rupture",
            jours_depuis_rupture: "$dernierStatutDureeInDay",
            libelle_formation: "$effectif_snapshot.formation.libelle_long",
            formation_niveau_libelle: { $ifNull: ["$effectif_snapshot.formation.niveau_libelle", null] },
            collab_status: "$collab_status",
            has_unread_notification: { $ifNull: ["$organisme_data.has_unread_notification", false] },
          },
        },
      },
    },
  ];

  const results = await missionLocaleEffectifsDb().aggregate(pipeline).toArray();

  const segmentMap = new Map<string, { effectifs: ICfaRuptureEffectif[] }>();
  for (const result of results) {
    segmentMap.set(result._id, { effectifs: result.effectifs });
  }

  return SEGMENT_ORDER.map((segment) => {
    const data = segmentMap.get(segment);
    const effectifs = data?.effectifs ?? [];
    return {
      segment,
      count: effectifs.length,
      effectifs,
    };
  });
}
