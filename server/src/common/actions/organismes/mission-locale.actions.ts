import Boom from "boom";
import { ObjectId } from "bson";
import { IUpdateMissionLocaleEffectifOrganisme } from "shared/models/routes/organismes/mission-locale/missions-locale.api";

import { missionLocaleEffectifsDb, missionLocaleEffectifsLogDb } from "@/common/model/collections";

import {
  ensureMissionLocaleEffectifRecord,
  resolveCfaEffectifSource,
} from "../mission-locale/mission-locale-record.actions";
import { createOrUpdateMissionLocaleStats } from "../mission-locale/mission-locale-stats.actions";

export const setEffectifMissionLocaleDataFromOrganisme = async (
  organismeId: ObjectId,
  effectifId: ObjectId,
  data: IUpdateMissionLocaleEffectifOrganisme,
  userId?: ObjectId
) => {
  const OPTIONAL_FIELDS: (keyof IUpdateMissionLocaleEffectifOrganisme)[] = [
    "motif",
    "commentaires",
    "still_at_cfa",
    "commentaires_par_motif",
    "cause_rupture",
    "referent_type",
    "referent_coordonnees",
    "note_complementaire",
    "verified_info",
  ];

  const setFields: Record<string, unknown> = {
    "organisme_data.rupture": data.rupture,
    "organisme_data.acc_conjoint": data.acc_conjoint,
    "organisme_data.reponse_at": new Date(),
    "organisme_data.has_unread_notification": false,
    ...(userId ? { "organisme_data.acc_conjoint_by": userId } : {}),
  };

  for (const key of OPTIONAL_FIELDS) {
    if (data[key] !== undefined) {
      setFields[`organisme_data.${key}`] = data[key];
    }
  }

  const effectifObjectId = new ObjectId(effectifId);
  const existingFilter = {
    "effectif_snapshot.organisme_id": organismeId,
    effectif_id: effectifObjectId,
    soft_deleted: { $ne: true },
  };

  const existing = await missionLocaleEffectifsDb().findOne(existingFilter);

  if (data.acc_conjoint && existing?.organisme_data?.acc_conjoint) {
    throw Boom.conflict("Un dossier de collaboration a déjà été envoyé pour cet effectif");
  }

  let targetFilter: Record<string, unknown> = existingFilter;

  if (!existing) {
    const { date_rupture: dateRupture } = data as IUpdateMissionLocaleEffectifOrganisme & { date_rupture?: Date };
    const source = await resolveCfaEffectifSource(organismeId, effectifObjectId);

    // Le `cfa_rupture_declaration` doit être posé dès la création : c'est lui qui garde le dossier
    // visible côté ML lors d'un repointage d'effectif_id (garde anti-disparition de migrateMlRecordEffectifId).
    const creationSet =
      dateRupture && userId
        ? { cfa_rupture_declaration: { date_rupture: dateRupture, declared_at: new Date(), declared_by: userId } }
        : {};

    const { recordId } = await ensureMissionLocaleEffectifRecord(
      organismeId,
      effectifId.toString(),
      source,
      creationSet,
      {
        dateRupture,
      }
    );

    if (!recordId) {
      throw Boom.internal("Impossible de créer le dossier Mission Locale pour cet effectif");
    }

    targetFilter = { _id: recordId };
  }

  const updated = await missionLocaleEffectifsDb().findOneAndUpdate(
    targetFilter,
    {
      $set: {
        ...setFields,
        updated_at: new Date(),
      },
    },
    { returnDocument: "after" }
  );
  if (!updated) {
    throw new Error("Effectif not found or update failed");
  }
  await createOrUpdateMissionLocaleStats(updated.mission_locale_id);
  return updated;
};

export const markEffectifNotificationAsRead = async (organismeId: ObjectId, effectifId: ObjectId, userId: ObjectId) => {
  const missionLocaleEffectif = await missionLocaleEffectifsDb().findOne({
    "effectif_snapshot.organisme_id": organismeId,
    effectif_id: new ObjectId(effectifId),
    "organisme_data.acc_conjoint_by": userId,
  });

  if (!missionLocaleEffectif) {
    return null;
  }

  await missionLocaleEffectifsLogDb().updateMany(
    {
      mission_locale_effectif_id: missionLocaleEffectif._id,
      read_by: { $ne: userId },
    },
    {
      $addToSet: { read_by: userId },
    }
  );

  const updated = await missionLocaleEffectifsDb().findOneAndUpdate(
    {
      _id: missionLocaleEffectif._id,
    },
    {
      $set: {
        "organisme_data.has_unread_notification": false,
        updated_at: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  return updated;
};
