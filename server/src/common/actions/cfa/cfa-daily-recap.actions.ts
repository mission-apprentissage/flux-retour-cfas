import { subHours } from "date-fns";
import { ObjectId } from "mongodb";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";

import {
  missionLocaleEffectifs2Db,
  missionLocaleEffectifsLogDb,
  organisationsDb,
  usersMigrationDb,
} from "@/common/model/collections";

const SITUATIONS_ACTIVES = [
  SITUATION_ENUM.NOUVEAU_PROJET,
  SITUATION_ENUM.RDV_PRIS,
  SITUATION_ENUM.DEJA_ACCOMPAGNE,
  SITUATION_ENUM.NOUVEAU_CONTRAT,
  SITUATION_ENUM.AUTRE,
  SITUATION_ENUM.CONTACTE_SANS_RETOUR,
  SITUATION_ENUM.INJOIGNABLE_APRES_RELANCES,
];

export interface IMissionLocaleWithActions {
  mission_locale: {
    id: string;
    nom: string;
  };
  effectifs_count: number;
  acc_conjoint_by: ObjectId | null;
}

export interface ICfaDailyStats {
  cfa: {
    _id: ObjectId;
    nom: string;
    siret: string;
  };
  missions_locales: IMissionLocaleWithActions[];
  total: number;
}

export async function getCfaEffectifsWithMlActionsLast24h(): Promise<ICfaDailyStats[]> {
  const yesterday = subHours(new Date(), 24);

  const cfasPilotes = await organisationsDb()
    .find(
      {
        type: "ORGANISME_FORMATION",
        ml_beta_activated_at: { $exists: true },
      },
      {
        projection: {
          _id: 1,
          organisme_id: 1,
        },
      }
    )
    .toArray();
  if (cfasPilotes.length === 0) {
    return [];
  }
  const cfaOrganismeIds = cfasPilotes
    .map((cfa) => (cfa as any).organisme_id)
    .filter((id) => id)
    .map((id) => new ObjectId(id));

  const logsRecents = await missionLocaleEffectifsLogDb()
    .find({
      created_at: { $gte: yesterday },
      situation: { $in: SITUATIONS_ACTIVES },
    })
    .toArray();
  if (logsRecents.length === 0) {
    return [];
  }

  const effectifIds = logsRecents.map((log) => log.mission_locale_effectif_id);

  const aggregationPipeline = [
    {
      $match: {
        _id: { $in: effectifIds },
        "computed.formation.organisme_formateur_id": { $in: cfaOrganismeIds },
        soft_deleted: { $ne: true },
      },
    },
    {
      $lookup: {
        from: "organismes",
        localField: "computed.formation.organisme_formateur_id",
        foreignField: "_id",
        as: "cfa_info",
      },
    },
    {
      $unwind: {
        path: "$cfa_info",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $lookup: {
        from: "organisations",
        localField: "mission_locale_id",
        foreignField: "_id",
        as: "mission_locale_info",
      },
    },
    {
      $unwind: {
        path: "$mission_locale_info",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $group: {
        _id: {
          cfa_id: "$computed.formation.organisme_formateur_id",
          cfa_nom: "$cfa_info.nom",
          cfa_siret: "$cfa_info.siret",
          ml_id: "$mission_locale_id",
          ml_nom: "$mission_locale_info.nom",
          acc_conjoint_by: "$organisme_data.acc_conjoint_by",
        },
        effectifs_count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: {
          cfa_id: "$_id.cfa_id",
          cfa_nom: "$_id.cfa_nom",
          cfa_siret: "$_id.cfa_siret",
        },
        missions_locales: {
          $push: {
            mission_locale: {
              id: { $toString: "$_id.ml_id" },
              nom: "$_id.ml_nom",
            },
            effectifs_count: "$effectifs_count",
            acc_conjoint_by: "$_id.acc_conjoint_by",
          },
        },
        total: { $sum: "$effectifs_count" },
      },
    },
    {
      $project: {
        _id: 0,
        cfa: {
          _id: "$_id.cfa_id",
          nom: "$_id.cfa_nom",
          siret: "$_id.cfa_siret",
        },
        missions_locales: 1,
        total: 1,
      },
    },
    {
      $sort: {
        "cfa.nom": 1,
      },
    },
  ];

  const results = await missionLocaleEffectifs2Db().aggregate(aggregationPipeline).toArray();
  return results as ICfaDailyStats[];
}

export async function getCfaPiloteUsers(
  cfaOrganismeId: ObjectId,
  userId?: ObjectId
): Promise<{
  organisation: any;
  users: any[];
}> {
  const organisation = await organisationsDb().findOne({
    organisme_id: cfaOrganismeId.toString(),
    type: "ORGANISME_FORMATION",
    ml_beta_activated_at: { $exists: true },
  });

  if (!organisation) {
    return { organisation: null, users: [] };
  }

  const userQuery: any = {
    organisation_id: organisation._id,
    account_status: "CONFIRMED",
  };

  if (userId) {
    userQuery._id = userId;
  }

  const users = await usersMigrationDb()
    .find(userQuery, {
      projection: {
        email: 1,
        nom: 1,
        prenom: 1,
      },
    })
    .toArray();

  return { organisation, users };
}

export async function getJeunesForCfaMl(
  cfaOrganismeId: ObjectId,
  missionLocaleId: ObjectId,
  since: Date,
  reponseBy?: ObjectId
): Promise<Array<{ nom: string; prenom: string }>> {
  const logsRecents = await missionLocaleEffectifsLogDb()
    .find({
      created_at: { $gte: since },
      situation: { $in: SITUATIONS_ACTIVES },
    })
    .toArray();

  if (logsRecents.length === 0) {
    return [];
  }

  const effectifIds = logsRecents.map((log) => log.mission_locale_effectif_id);

  const query: any = {
    _id: { $in: effectifIds },
    "computed.formation.organisme_formateur_id": cfaOrganismeId,
    mission_locale_id: missionLocaleId,
    soft_deleted: { $ne: true },
  };

  if (reponseBy) {
    query["organisme_data.acc_conjoint_by"] = reponseBy;
  }

  const effectifs = await missionLocaleEffectifs2Db()
    .find(query, {
      projection: {
        "computed.person.identifiant.nom": 1,
        "computed.person.identifiant.prenom": 1,
      },
    })
    .toArray();

  return effectifs
    .map((effectif) => ({
      nom: effectif.computed?.person?.identifiant?.nom || "",
      prenom: effectif.computed?.person?.identifiant?.prenom || "",
    }))
    .filter((jeune) => jeune.nom && jeune.prenom);
}
