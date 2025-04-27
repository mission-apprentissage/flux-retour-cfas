import Boom from "boom";
import { ObjectId } from "bson";
import { IOrganisationMissionLocale, IUpdateMissionLocaleEffectif } from "shared/models";

import { missionLocaleEffectifsDb, organisationsDb } from "@/common/model/collections";

import { createEffectifMissionLocaleLog } from "../../mission-locale/mission-locale-logs.actions";

export const activateMissionLocale = async (missionLocaleId: string, date: Date) => {
  const ml = await organisationsDb().findOne({ type: "MISSION_LOCALE", _id: new ObjectId(missionLocaleId) });

  if (!ml) {
    throw new Error(`Mission locale with id ${missionLocaleId} not found`);
  }

  await organisationsDb().updateOne(
    { _id: new ObjectId(missionLocaleId) },
    {
      $set: {
        activated_at: date,
      },
    }
  );
};

export const getAllMlFromOrganisations = async (): Promise<Array<IOrganisationMissionLocale>> => {
  const mls = await organisationsDb()
    .find({
      type: "MISSION_LOCALE",
    })
    .toArray();

  return mls as Array<IOrganisationMissionLocale>;
};

export const setEffectifMissionLocaleDataAdmin = async (effectifId: ObjectId, data: IUpdateMissionLocaleEffectif) => {
  const { situation, situation_autre, commentaires, deja_connu } = data;

  const mlEff = await missionLocaleEffectifsDb().findOne({ effectif_id: new ObjectId(effectifId) });
  if (!mlEff) {
    throw Boom.notFound();
  }

  const setObject = {
    situation,
    deja_connu,
    ...(situation_autre !== undefined ? { situation_autre } : {}),
    ...(commentaires !== undefined ? { commentaires } : {}),
  };

  await createEffectifMissionLocaleLog(mlEff?._id, {
    situation,
    situation_autre,
    commentaires,
    deja_connu,
  });

  const updated = await missionLocaleEffectifsDb().findOneAndUpdate(
    {
      effectif_id: new ObjectId(effectifId),
    },
    {
      $set: {
        ...setObject,
        updated_at: new Date(),
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  return updated;
};

export const resetEffectifMissionLocaleDataAdmin = async (effectifId: ObjectId) => {
  const mlEff = await missionLocaleEffectifsDb().findOne({ effectif_id: new ObjectId(effectifId) });
  if (!mlEff) {
    throw Boom.notFound();
  }

  await createEffectifMissionLocaleLog(mlEff?._id, {
    situation: undefined,
    situation_autre: undefined,
    commentaires: undefined,
    deja_connu: undefined,
  });

  await missionLocaleEffectifsDb().updateOne(
    {
      effectif_id: new ObjectId(effectifId),
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
};
