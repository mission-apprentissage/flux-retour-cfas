import Boom from "boom";
import { ObjectId } from "bson";
import { IMissionLocaleStats, IOrganisationMissionLocale, IUpdateMissionLocaleEffectif } from "shared/models";

import {
  missionLocaleEffectifsDb,
  missionLocaleEffectifsLogDb,
  organisationsDb,
  usersMigrationDb,
} from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";
import {
  updateEffectifMissionLocaleSnapshotAtMLActivation,
  updateEffectifMissionLocaleSnapshotAtOrganismeActivation,
} from "@/jobs/hydrate/mission-locale/hydrate-mission-locale";

import { createEffectifMissionLocaleLog } from "../../mission-locale/mission-locale-logs.actions";
import { createOrUpdateMissionLocaleStats } from "../../mission-locale/mission-locale-stats.actions";
import { getMissionLocaleStat } from "../../mission-locale/mission-locale.actions";
import { getOrganisationOrganismeByOrganismeId } from "../../organisations.actions";

export const activateMissionLocaleAtAdminValidation = async (missionLocaleId: ObjectId, date: Date) => {
  const ml = await organisationsDb().findOne({
    type: "MISSION_LOCALE",
    _id: missionLocaleId,
    activated_at: { $exists: false },
  });

  if (!ml) {
    return;
  }

  await activateMissionLocale(missionLocaleId, date);
};

export const activateMissionLocale = async (missionLocaleId: ObjectId, date: Date) => {
  await organisationsDb().updateOne(
    { _id: new ObjectId(missionLocaleId) },
    {
      $set: {
        activated_at: date,
      },
    }
  );

  await updateEffectifMissionLocaleSnapshotAtMLActivation(missionLocaleId);
  await updateMissionLocaleEffectifComputedML(date, new ObjectId(missionLocaleId));
};

export const getAllMlFromOrganisations = async (): Promise<Array<IOrganisationMissionLocale>> => {
  const mls = await organisationsDb()
    .find({
      type: "MISSION_LOCALE",
    })
    .toArray();

  return mls as Array<IOrganisationMissionLocale>;
};

export const getMlFromOrganisations = async (id: string): Promise<IOrganisationMissionLocale | null> => {
  const ml = await organisationsDb().findOne({
    _id: new ObjectId(id),
    type: "MISSION_LOCALE",
  });

  return ml as IOrganisationMissionLocale | null;
};

export const setEffectifMissionLocaleDataAdmin = async (
  missionLocaleId: ObjectId,
  effectifId: ObjectId,
  data: IUpdateMissionLocaleEffectif,
  user: AuthContext
) => {
  const { situation, situation_autre, commentaires, deja_connu } = data;

  const mlEff = await missionLocaleEffectifsDb().findOne({
    effectif_id: new ObjectId(effectifId),
    mission_locale_id: new ObjectId(missionLocaleId),
  });

  if (!mlEff) {
    throw Boom.notFound("Effectif introuvable");
  }

  const setObject = {
    situation,
    deja_connu,
    ...(situation_autre !== undefined ? { situation_autre } : {}),
    ...(commentaires !== undefined ? { commentaires } : {}),
  };

  await createEffectifMissionLocaleLog(mlEff?._id, setObject, user);

  const updated = await missionLocaleEffectifsDb().findOneAndUpdate(
    {
      effectif_id: new ObjectId(effectifId),
      mission_locale_id: new ObjectId(missionLocaleId),
    },
    {
      $set: {
        ...setObject,
        updated_at: new Date(),
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  await createOrUpdateMissionLocaleStats(missionLocaleId);

  return updated;
};

export const resetEffectifMissionLocaleDataAdmin = async (
  missionLocaleId: ObjectId,
  effectifId: ObjectId,
  user: AuthContext
) => {
  const mlEff = await missionLocaleEffectifsDb().findOne({
    effectif_id: new ObjectId(effectifId),
    mission_locale_id: new ObjectId(missionLocaleId),
  });

  if (!mlEff) {
    throw Boom.notFound("Effectif introuvable");
  }

  await createEffectifMissionLocaleLog(
    mlEff?._id,
    {
      situation: undefined,
      situation_autre: undefined,
      commentaires: undefined,
      deja_connu: undefined,
    },
    user
  );

  await missionLocaleEffectifsDb().updateOne(
    {
      effectif_id: new ObjectId(effectifId),
      mission_locale_id: new ObjectId(missionLocaleId),
    },
    {
      $set: {
        updated_at: new Date(),
      },
      $unset: {
        situation: 1,
        situation_autre: 1,
        deja_connu: 1,
        commentaires: 1,
      },
    }
  );

  await createOrUpdateMissionLocaleStats(missionLocaleId);
};

export const getMissionsLocalesStatsAdmin = async (arml: Array<string>) => {
  const aggr = [
    {
      $match: {
        type: "MISSION_LOCALE",
        ...(arml && arml.length ? { arml_id: { $in: arml.map((id) => new ObjectId(id)) } } : {}),
      },
    },
    {
      $lookup: {
        from: "missionLocaleStats",
        let: { ml_id: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$mission_locale_id", "$$ml_id"] },
            },
          },
          {
            $sort: { computed_day: -1 },
          },
          {
            $limit: 1,
          },
        ],
        as: "stats",
      },
    },
    {
      $unwind: {
        path: "$stats",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "organisations",
        localField: "arml_id",
        foreignField: "_id",
        as: "arml",
      },
    },
    {
      $unwind: {
        path: "$arml",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        stats: {
          $ifNull: [
            "$stats.stats",
            {
              total: 0,
              a_traiter: 0,
              traite: 0,
              sans_statut: 0,
              a_contacter: 0,
              autres: 0,
            },
          ],
        },
      },
    },
    {
      $project: {
        _id: 1,
        nom: { $trim: { input: "$nom" } },
        code_postal: "$adresse.code_postal",
        activated_at: 1,
        arml_id: 1,
        arml: "$arml.nom",
        stats: 1,
      },
    },
  ];

  return organisationsDb().aggregate(aggr).toArray() as Promise<
    Array<{
      _id: ObjectId;
      nom: string;
      code_postal: string;
      activated_at: Date;
      arml_id: ObjectId;
      stats: IMissionLocaleStats["stats"];
    }>
  >;
};

export const getMissionsLocalesStatsAdminById = async (
  missionLocale: IOrganisationMissionLocale,
  mineur?: boolean,
  rqth?: boolean
) => {
  return getMissionLocaleStat(missionLocale, mineur, rqth);
};

// CFA

export const activateOrganisme = async (date: Date, organisme_id: ObjectId) => {
  const organisation = await getOrganisationOrganismeByOrganismeId(organisme_id);

  if (!organisation) {
    throw Boom.notFound(`No organisation found for id: ${organisme_id}`);
  }

  await organisationsDb().updateOne(
    { _id: organisation._id, type: "ORGANISME_FORMATION" },
    {
      $set: {
        ml_beta_activated_at: date,
      },
    }
  );
  await updateEffectifMissionLocaleSnapshotAtOrganismeActivation(organisme_id);
  await updateMissionLocaleEffectifComputedOrganisme(date, organisme_id);
  return organisation;
};

export const updateMissionLocaleEffectifComputedOrganisme = (date: Date, organismeId: ObjectId) => {
  return missionLocaleEffectifsDb().updateMany(
    { "effectif_snapshot.organisme_id": organismeId },
    {
      $set: {
        "computed.organisme.ml_beta_activated_at": date,
      },
    }
  );
};

export const updateMissionLocaleEffectifComputedML = (date: Date, missionLocaleId: ObjectId) => {
  return missionLocaleEffectifsDb().updateMany(
    { mission_locale_id: missionLocaleId },
    {
      $set: {
        "computed.mission_locale.activated_at": date,
      },
    }
  );
};

export interface IMissionLocaleMember {
  _id: ObjectId;
  civility: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  last_traitement_at: Date | null;
}

export interface IMissionLocaleDetail {
  ml: IOrganisationMissionLocale;
  activated_at: Date | null;
  last_activity_at: Date | null;
  has_cfa_collaboration: boolean;
  traites_count: number;
}

export const getMissionLocaleMembers = async (missionLocaleId: ObjectId): Promise<IMissionLocaleMember[]> => {
  const users = await usersMigrationDb()
    .find({
      organisation_id: missionLocaleId,
      account_status: "CONFIRMED",
    })
    .toArray();

  const mlEffectifs = await missionLocaleEffectifsDb()
    .find({ mission_locale_id: missionLocaleId }, { projection: { _id: 1 } })
    .toArray();

  const mlEffectifIds = mlEffectifs.map((e) => e._id);

  const membersWithActivity = await Promise.all(
    users.map(async (user) => {
      const lastLog = await missionLocaleEffectifsLogDb()
        .find({
          mission_locale_effectif_id: { $in: mlEffectifIds },
          created_by: user._id,
        })
        .sort({ created_at: -1 })
        .limit(1)
        .toArray();

      return {
        _id: user._id,
        civility: user.civility || "",
        nom: user.nom || "",
        prenom: user.prenom || "",
        telephone: user.telephone || "",
        email: user.email || "",
        last_traitement_at: lastLog.length > 0 ? lastLog[0].created_at : null,
      };
    })
  );

  return membersWithActivity;
};

export const getMissionLocaleDetail = async (missionLocaleId: ObjectId): Promise<IMissionLocaleDetail> => {
  const ml = (await organisationsDb().findOne({
    _id: missionLocaleId,
    type: "MISSION_LOCALE",
  })) as IOrganisationMissionLocale | null;

  if (!ml) {
    throw new Error(`Mission Locale not found: ${missionLocaleId}`);
  }

  const mlEffectifs = await missionLocaleEffectifsDb()
    .find(
      { mission_locale_id: missionLocaleId },
      { projection: { _id: 1, situation: 1, "effectif_snapshot.organisme_id": 1 } }
    )
    .toArray();

  const mlEffectifIds = mlEffectifs.map((e) => e._id);

  const lastLog = await missionLocaleEffectifsLogDb()
    .find({ mission_locale_effectif_id: { $in: mlEffectifIds } })
    .sort({ created_at: -1 })
    .limit(1)
    .toArray();

  const hasCfaCollaboration = await missionLocaleEffectifsDb().countDocuments({
    mission_locale_id: missionLocaleId,
    "organisme_data.acc_conjoint": true,
  });

  const traitesCount = mlEffectifs.filter((e) => e.situation != null).length;

  return {
    ml,
    activated_at: ml.activated_at || null,
    last_activity_at: lastLog.length > 0 ? lastLog[0].created_at : null,
    has_cfa_collaboration: hasCfaCollaboration > 0,
    traites_count: traitesCount,
  };
};
