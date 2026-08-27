import Boom from "boom";
import { ObjectId } from "bson";
import { RQTH_DECLARE_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import { IUpdateMissionLocaleEffectifOrganisme } from "shared/models/routes/organismes/mission-locale/missions-locale.api";

import { missionLocaleEffectifsDb, missionLocaleEffectifsLogDb } from "@/common/model/collections";

import {
  ensureMissionLocaleEffectifRecord,
  resolveCfaEffectifSource,
} from "../mission-locale/mission-locale-record.actions";
import { createOrUpdateMissionLocaleStats } from "../mission-locale/mission-locale-stats.actions";

const isMineur = (dateDeNaissance: Date) => {
  const majorite = new Date(dateDeNaissance);
  majorite.setFullYear(majorite.getFullYear() + 18);
  return majorite > new Date();
};

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
    "situation_type",
    "risque_rupture",
    "date_abandon",
    "date_debut_formation",
    "recherche_entreprise",
    "form_feedback",
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

  if (data.form_feedback) {
    setFields["organisme_data.form_feedback"] = { ...data.form_feedback, responded_at: new Date() };
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

  const dateRupture = data.date_rupture;
  // La date saisie par le CFA fait foi, que le dossier existe déjà ou non : c'est aussi elle qui
  // garde le dossier visible côté ML lors d'un repointage d'effectif_id
  // (garde anti-disparition de migrateMlRecordEffectifId).
  const ruptureDeclaration =
    dateRupture && userId
      ? {
          cfa_rupture_declaration: { date_rupture: dateRupture, declared_at: new Date(), declared_by: userId },
          date_rupture: dateRupture,
        }
      : {};

  if (!existing) {
    const source = await resolveCfaEffectifSource(organismeId, effectifObjectId);

    const { recordId } = await ensureMissionLocaleEffectifRecord(
      organismeId,
      effectifId.toString(),
      source,
      ruptureDeclaration,
      {
        dateRupture,
      }
    );

    if (!recordId) {
      throw Boom.internal("Impossible de créer le dossier Mission Locale pour cet effectif");
    }

    targetFilter = { _id: recordId };
  }

  const targetRecord = existing ?? (await missionLocaleEffectifsDb().findOne(targetFilter as Record<string, unknown>));

  if (data.verified_info) {
    const dateDeNaissance = targetRecord?.effectif_snapshot?.apprenant?.date_de_naissance;
    // RG14 : les coordonnées du responsable légal ne concernent que les mineurs. Le front les
    // masque, le serveur ne s'y fie pas.
    if (data.verified_info.responsable_legal && dateDeNaissance && !isMineur(dateDeNaissance)) {
      const { responsable_legal: _responsableLegal, ...verifiedInfo } = data.verified_info;
      setFields["organisme_data.verified_info"] = verifiedInfo;
    }

    const rqthDeclare = data.verified_info.rqth_declare;
    if (rqthDeclare === RQTH_DECLARE_ENUM.OUI || rqthDeclare === RQTH_DECLARE_ENUM.NON) {
      setFields["effectif_snapshot.apprenant.rqth"] = rqthDeclare === RQTH_DECLARE_ENUM.OUI;
    }
  }

  const updated = await missionLocaleEffectifsDb().findOneAndUpdate(
    targetFilter,
    {
      $set: {
        ...setFields,
        ...ruptureDeclaration,
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
