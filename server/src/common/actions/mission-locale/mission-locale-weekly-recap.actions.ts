import { IOrganisationMissionLocale } from "shared/models";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";

import { missionLocaleEffectifsDb, organisationsDb } from "@/common/model/collections";

import { missionLocaleBaseAggregation } from "./mission-locale.actions";

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
    ...missionLocaleBaseAggregation(organisation),
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
