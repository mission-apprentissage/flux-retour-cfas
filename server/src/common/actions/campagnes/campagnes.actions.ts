import Boom from "boom";

import { missionLocaleEffectifsDb } from "@/common/model/collections";

export const getMissionLocaleEffectifInfoFromToken = async (token: string) => {
  const aggregation = [
    {
      $match: {
        "brevo.token": token,
      },
    },
    {
      $lookup: {
        from: "organisations",
        let: { id: "$mission_locale_id" },
        pipeline: [
          { $match: { type: "MISSION_LOCALE" } },
          { $match: { $expr: { $eq: ["$_id", "$$id"] } } },
          {
            $project: {
              _id: 1,
              nom: 1,
            },
          },
        ],
        as: "organisation",
      },
    },
    {
      $unwind: {
        path: "$organisation",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "organismes",
        let: { organismeFormateurId: "$effectif_snapshot.organisme_formateur_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$_id", "$$organismeFormateurId"],
              },
            },
          },
          {
            $project: {
              _id: 1,
              nom: 1,
            },
          },
        ],
        as: "organismeFormateur",
      },
    },
    {
      $unwind: {
        path: "$organismeFormateur",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        "missionLocale.nom": "$organisation.nom",
        telephone: "$effectif_snapshot.apprenant.telephone",
        formation: "$effectif_snapshot.formation",
        "organismeFormateur.nom": "$organismeFormateur.nom",
      },
    },
  ];

  const effectif = await missionLocaleEffectifsDb().aggregate(aggregation).next();

  if (!effectif) {
    throw Boom.notFound();
  }

  return effectif;
};

export const confirmEffectifChoiceByTokenDbUpdate = async (token: string, confirmation: string) => {
  const doc = await missionLocaleEffectifsDb().findOne({ "brevo.token": token });
  if (!doc) {
    throw Boom.notFound();
  }

  const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
  const result = await missionLocaleEffectifsDb().updateOne(
    { _id: doc._id },
    {
      $set: {
        "effectif_choice.confirmation": confirmation === "true",
        "effectif_choice.confirmation_created_at": new Date(),
        "effectif_choice.confirmation_expired_at": new Date(Date.now() + oneWeekInMs),
      },
    }
  );
  return result;
};

export const updateEffectifPhoneNumberByTokenDbUpdate = async (token: string, telephone: string) => {
  const doc = await missionLocaleEffectifsDb().findOne({ "brevo.token": token });
  if (!doc) {
    throw Boom.notFound();
  }
  const result = await missionLocaleEffectifsDb().updateOne(
    { _id: doc._id },
    {
      $set: {
        "effectif_choice.telephone": telephone,
      },
    }
  );
  return result;
};

export const deactivateEffectifToken = async (token: string) => {
  const doc = await missionLocaleEffectifsDb().findOne({ "brevo.token": token });
  if (!doc) {
    throw Boom.notFound();
  }

  const tokenHistoryEntry = {
    token: doc.brevo.token,
    token_created_at: doc.brevo.token_created_at,
    token_expired_at: new Date(),
  };

  const result = await missionLocaleEffectifsDb().updateOne(
    { _id: doc._id },
    {
      $push: {
        "brevo.history": tokenHistoryEntry,
      },
      $set: {
        "brevo.token": null,
        "brevo.token_created_at": null,
        "brevo.token_expired_at": null,
      },
    }
  );

  return result;
};
