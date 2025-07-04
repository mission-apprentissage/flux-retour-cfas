import Boom from "boom";
import { ObjectId } from "bson";
import { IMissionLocaleStats, IOrganisationMissionLocale, IUpdateMissionLocaleEffectif } from "shared/models";

import { missionLocaleEffectifsDb, organisationsDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { updateEffectifMissionLocaleSnapshotAtActivation } from "@/jobs/hydrate/mission-locale/hydrate-mission-locale";

import { createEffectifMissionLocaleLog } from "../../mission-locale/mission-locale-logs.actions";
import { createOrUpdateMissionLocaleStats } from "../../mission-locale/mission-locale-stats.actions";

export const activateMissionLocaleAtFirstInvitation = async (missionLocaleId: ObjectId, date: Date) => {
  const ml = await organisationsDb()
    .aggregate([
      {
        $match: {
          type: "MISSION_LOCALE",
          _id: missionLocaleId,
        },
      },
      {
        $lookup: {
          from: "usersMigration",
          localField: "_id",
          foreignField: "organisation_id",
          as: "users",
        },
      },
      {
        $match: {
          "users.0": {
            $exists: false,
          },
        },
      },
    ])
    .next();

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

  await updateEffectifMissionLocaleSnapshotAtActivation(missionLocaleId);
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
        localField: "_id",
        foreignField: "mission_locale_id",
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
      $project: {
        _id: 1,
        nom: 1,
        code_postal: "$adresse.code_postal",
        activated_at: 1,
        arml_id: 1,
        stats: "$stats.stats",
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
