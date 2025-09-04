import { IOrganisationMissionLocale } from "shared/models";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import { getAnneeScolaireListFromDateRange } from "shared/utils";

import { missionLocaleEffectifsDb, organisationsDb } from "@/common/model/collections";

const DATE_START = new Date("2025-01-01");

export interface IMissionLocaleEffectifsStats {
  effectifs_prioritaire: number;
  effectifs_a_traiter: number;
  effectifs_a_recontacter: number;
  total: number;
}

export async function getMissionLocaleEffectifsStats(missionLocaleId: number): Promise<IMissionLocaleEffectifsStats> {
  const organisation = (await organisationsDb().findOne({
    ml_id: missionLocaleId,
    type: "MISSION_LOCALE",
  })) as IOrganisationMissionLocale;

  if (!organisation) {
    return {
      effectifs_prioritaire: 0,
      effectifs_a_traiter: 0,
      effectifs_a_recontacter: 0,
      total: 0,
    };
  }

  const aggregationPipeline = [
    {
      $match: {
        mission_locale_id: organisation._id,
      },
    },
    {
      $match: {
        "effectif_snapshot.annee_scolaire": {
          $in: getAnneeScolaireListFromDateRange(DATE_START, new Date()),
        },
      },
    },
    {
      $match: {
        $or: [
          {
            "effectif_snapshot.apprenant.date_de_naissance": {
              $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 26)),
            },
          },
          { "effectif_snapshot.apprenant.rqth": true },
        ],
        soft_deleted: { $ne: true },
        "effectif_snapshot.apprenant.date_de_naissance": {
          $lte: new Date(new Date().setFullYear(new Date().getFullYear() - 16)),
        },
      },
    },
    {
      $addFields: {
        dernierStatutDureeInDay: {
          $dateDiff: { startDate: "$date_rupture", endDate: new Date(), unit: "day" },
        },
      },
    },
    {
      $addFields: {
        nouveau_contrat: {
          $cond: [{ $eq: ["$current_status.value", "APPRENTI"] }, true, false],
        },
      },
    },
    {
      $match: {
        "effectif_snapshot._computed.statut.en_cours": "RUPTURANT",
        date_rupture: { $lte: new Date() },
      },
    },
    {
      $addFields: {
        in_activation_range: organisation.activated_at
          ? {
              $cond: [
                {
                  $gte: [
                    "$date_rupture",
                    new Date(new Date(organisation.activated_at).getTime() - 180 * 24 * 60 * 60 * 1000),
                  ],
                },
                true,
                false,
              ],
            }
          : true,
      },
    },
    {
      $match: {
        in_activation_range: true,
      },
    },
    {
      $addFields: {
        in_joint_organisme_range: {
          $cond: [
            {
              $or: [
                { $eq: [{ $ifNull: ["$computed.organisme.ml_beta_activated_at", null] }, null] },
                { $gte: ["$computed.organisme.ml_beta_activated_at", "$created_at"] },
                { $eq: ["$organisme_data.acc_conjoint", true] },
              ],
            },
            true,
            false,
          ],
        },
      },
    },
    {
      $match: {
        in_joint_organisme_range: true,
      },
    },
    {
      $addFields: {
        a_traiter: {
          $cond: [{ $eq: ["$situation", "$$REMOVE"] }, true, false],
        },
        a_risque: {
          $cond: [
            {
              $and: [
                {
                  $or: [
                    { $eq: ["$effectif_snapshot.apprenant.rqth", true] },
                    {
                      $and: [
                        {
                          $gte: [
                            "$effectif_snapshot.apprenant.date_de_naissance",
                            new Date(new Date().setFullYear(new Date().getFullYear() - 18)),
                          ],
                        },
                        {
                          $lte: [
                            "$effectif_snapshot.apprenant.date_de_naissance",
                            new Date(new Date().setFullYear(new Date().getFullYear() - 16)),
                          ],
                        },
                      ],
                    },
                    {
                      $eq: ["$organisme_data.acc_conjoint", true],
                    },
                  ],
                },
                {
                  $ne: ["$current_status.value", "APPRENTI"],
                },
              ],
            },
            true,
            false,
          ],
        },
        a_contacter: {
          $cond: [{ $eq: ["$effectif_choice.confirmation", true] }, true, false],
        },
      },
    },
    {
      $group: {
        _id: null,
        total_docs: { $sum: 1 },
        effectifs_a_traiter: {
          $sum: { $cond: [{ $eq: ["$a_traiter", true] }, 1, 0] },
        },
        effectifs_prioritaire: {
          $sum: {
            $cond: [
              {
                $and: [
                  {
                    $or: [{ $eq: ["$a_traiter", true] }, { $eq: ["$situation", SITUATION_ENUM.CONTACTE_SANS_RETOUR] }],
                  },
                  {
                    $or: [
                      { $eq: ["$a_contacter", true] },
                      { $and: [{ $eq: ["$a_risque", true] }, { $eq: ["$nouveau_contrat", false] }] },
                    ],
                  },
                ],
              },
              1,
              0,
            ],
          },
        },
        effectifs_a_recontacter: {
          $sum: { $cond: [{ $eq: ["$situation", SITUATION_ENUM.CONTACTE_SANS_RETOUR] }, 1, 0] },
        },
      },
    },
  ];

  const result = await missionLocaleEffectifsDb().aggregate(aggregationPipeline).next();

  if (!result) {
    return {
      effectifs_prioritaire: 0,
      effectifs_a_traiter: 0,
      effectifs_a_recontacter: 0,
      total: 0,
    };
  }

  const total = result.effectifs_a_traiter + result.effectifs_a_recontacter;

  return {
    effectifs_prioritaire: result.effectifs_prioritaire || 0,
    effectifs_a_traiter: result.effectifs_a_traiter || 0,
    effectifs_a_recontacter: result.effectifs_a_recontacter || 0,
    total,
  };
}
