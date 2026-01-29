import { subHours } from "date-fns";
import { IOrganisationMissionLocale } from "shared/models";

import { missionLocaleEffectifs2Db, organisationsDb } from "@/common/model/collections";

export interface IMissionLocaleEffectifsAccConjoint {
  cfa: {
    nom: string;
    siret: string;
  };
  effectifs_count: number;
}

export interface IMissionLocaleDailyStats {
  effectifs_acc_conjoint: IMissionLocaleEffectifsAccConjoint[];
  total: number;
}

export async function getMissionLocaleEffectifsAccConjointLast24h(
  missionLocaleId: number
): Promise<IMissionLocaleDailyStats> {
  const organisation = (await organisationsDb().findOne({
    ml_id: missionLocaleId,
    type: "MISSION_LOCALE",
  })) as IOrganisationMissionLocale;

  if (!organisation) {
    return {
      effectifs_acc_conjoint: [],
      total: 0,
    };
  }

  const yesterday = subHours(new Date(), 24);

  const aggregationPipeline = [
    {
      $match: {
        mission_locale_id: organisation._id,
        "organisme_data.acc_conjoint": true,
        "organisme_data.reponse_at": { $gte: yesterday },
        $or: [{ situation: { $exists: false } }, { situation: null }],
      },
    },
    {
      $lookup: {
        from: "organismes",
        localField: "effectif_snapshot.organisme_id",
        foreignField: "_id",
        as: "organisme_info",
      },
    },
    {
      $unwind: {
        path: "$organisme_info",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: {
          organisme_id: "$computed.formation.organisme_formateur_id",
          nom: "$organisme_info.nom",
          siret: "$organisme_info.siret",
        },
        effectifs_count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        cfa: {
          nom: "$_id.nom",
          siret: "$_id.siret",
        },
        effectifs_count: 1,
      },
    },
    {
      $sort: {
        "cfa.nom": 1,
      },
    },
  ];

  const results = await missionLocaleEffectifs2Db().aggregate(aggregationPipeline).toArray();

  const effectifs_acc_conjoint = results as IMissionLocaleEffectifsAccConjoint[];
  const total = effectifs_acc_conjoint.reduce((sum, item) => sum + item.effectifs_count, 0);

  return {
    effectifs_acc_conjoint,
    total,
  };
}
