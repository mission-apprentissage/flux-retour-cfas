import { captureException } from "@sentry/node";
import { ObjectId } from "mongodb";
import { CODES_STATUT_APPRENANT } from "shared/constants";
import { IEffectif, IOrganisationMissionLocale } from "shared/models";
import { IEffectifDECA } from "shared/models/data/effectifsDECA.model";

import { activateMissionLocale } from "@/common/actions/admin/mission-locale/mission-locale.admin.actions";
import { updateEffectifStatut } from "@/common/actions/effectifs.statut.actions";
import { getAndFormatCommuneFromCode } from "@/common/actions/engine/engine.actions";
import { createOrUpdateMissionLocaleStats } from "@/common/actions/mission-locale/mission-locale-stats.actions";
import {
  checkMissionLocaleEffectifDoublon,
  createMissionLocaleSnapshot,
  getAllEffectifForMissionLocaleCursor,
  updateOrDeleteMissionLocaleSnapshot,
} from "@/common/actions/mission-locale/mission-locale.actions";
import { normalisePersonIdentifiant } from "@/common/actions/personV2/personV2.actions";
import { apiAlternanceClient } from "@/common/apis/apiAlternance/client";
import {
  effectifsDb,
  effectifsQueueDb,
  missionLocaleEffectifsDb,
  missionLocaleStatsDb,
  organisationsDb,
} from "@/common/model/collections";

export const hydrateMissionLocaleSnapshot = async (missionLocaleStructureId: number | null) => {
  const cursor = organisationsDb().find({
    type: "MISSION_LOCALE",
    ...(missionLocaleStructureId ? { ml_id: missionLocaleStructureId } : {}),
  });

  while (await cursor.hasNext()) {
    const orga = (await cursor.next()) as IOrganisationMissionLocale;
    const cursor2 = getAllEffectifForMissionLocaleCursor(orga.ml_id);
    while (await cursor2.hasNext()) {
      const eff = await cursor2.next();
      if (eff) {
        await createMissionLocaleSnapshot(eff);
      }
    }
  }
};

export const hydrateMissionLocaleOrganisation = async () => {
  const allMl = await apiAlternanceClient.geographie.listMissionLocales({});
  const currentDate = new Date();
  for (const ml of allMl) {
    const missionLocale = await organisationsDb().findOne({ ml_id: ml.id });

    if (!missionLocale) {
      await organisationsDb().insertOne({
        _id: new ObjectId(),
        type: "MISSION_LOCALE",
        created_at: currentDate,
        ml_id: ml.id,
        nom: ml.nom,
        siret: ml.siret,
      });

      await hydrateMissionLocaleSnapshot(ml.id);
    }
  }
};

export const updateMissionLocaleSnapshotFromLastStatus = async () => {
  const cursor = organisationsDb().find({
    type: "MISSION_LOCALE",
  });

  while (await cursor.hasNext()) {
    const orga = (await cursor.next()) as IOrganisationMissionLocale;
    const cursor2 = missionLocaleEffectifsDb().find({ mission_locale_id: orga._id, situation: { $exists: false } });
    while (await cursor2.hasNext()) {
      const eff = await cursor2.next();

      if (eff) {
        const lastEffectifQueue = await effectifsQueueDb()
          .find({
            effectif_id: eff.effectif_id,
          })
          .sort({ created_at: -1 })
          .limit(1)
          .toArray();

        if (
          lastEffectifQueue &&
          lastEffectifQueue.length > 0 &&
          lastEffectifQueue[0].statut_apprenant === CODES_STATUT_APPRENANT.abandon &&
          lastEffectifQueue[0].date_metier_mise_a_jour_statut
        ) {
          {
            const date: string = lastEffectifQueue[0].date_metier_mise_a_jour_statut as string;

            await effectifsDb().updateOne(
              { _id: eff.effectif_id },
              {
                $set: {
                  "formation.date_exclusion": new Date(date),
                },
              }
            );
            const effToCompute = await effectifsDb().findOne({ _id: eff.effectif_id });
            await updateEffectifStatut(effToCompute as IEffectif, new Date(), effectifsDb());
            const effToSnap = await effectifsDb().findOne({ _id: eff.effectif_id });
            if (effToSnap) {
              updateOrDeleteMissionLocaleSnapshot(effToSnap);
            }
          }
        }
      }
    }
  }
};

export const updateEffectifMissionLocaleSnapshotAtMLActivation = async (missionLocaleId: ObjectId) => {
  const cursor = missionLocaleEffectifsDb().find({
    mission_locale_id: new ObjectId(missionLocaleId),
    situation: null,
    $or: [
      { "computed.organisme.ml_beta_activated_at": null },
      { "computed.organisme.ml_beta_activated_at": { $exists: false } },
    ],
  });

  while (await cursor.hasNext()) {
    const effML = await cursor.next();
    if (!effML) {
      continue;
    }
    const upToDateEffectif = (await effectifsDb()
      .aggregate([
        {
          $unionWith: {
            coll: "effectifsDECA",
            pipeline: [{ $match: { _id: effML.effectif_id } }],
          },
        },
        {
          $match: {
            _id: effML.effectif_id,
          },
        },
      ])
      .toArray()) as Array<IEffectif | IEffectifDECA>;

    if (!upToDateEffectif || upToDateEffectif.length === 0) {
      continue;
    }
    await updateOrDeleteMissionLocaleSnapshot(upToDateEffectif[0]);
  }
};

export const updateEffectifMissionLocaleSnapshotAtOrganismeActivation = async (organismeId: ObjectId) => {
  const cursor = missionLocaleEffectifsDb().find({
    "effectif_snapshot.organisme_id": new ObjectId(organismeId),
    situation: { $exists: false },
  });

  while (await cursor.hasNext()) {
    const effML = await cursor.next();
    if (!effML) {
      continue;
    }
    const upToDateEffectif = (await effectifsDb()
      .aggregate([
        {
          $unionWith: {
            coll: "effectifsDECA",
            pipeline: [{ $match: { _id: effML.effectif_id } }],
          },
        },
        {
          $match: {
            _id: effML.effectif_id,
          },
        },
      ])
      .toArray()) as Array<IEffectif | IEffectifDECA>;

    if (!upToDateEffectif || upToDateEffectif.length === 0) {
      continue;
    }
    await updateOrDeleteMissionLocaleSnapshot(upToDateEffectif[0]);
  }
};

export const hydrateMissionLocaleAdresse = async () => {
  const allMl = await apiAlternanceClient.geographie.listMissionLocales({});

  for (const ml of allMl) {
    const missionLocale = await organisationsDb().findOne({ ml_id: ml.id, type: "MISSION_LOCALE" });
    const { mission_locale_id, ...rest } = await getAndFormatCommuneFromCode(null, ml.localisation.cp);

    if (missionLocale) {
      await organisationsDb().updateOne(
        {
          _id: missionLocale._id,
        },
        {
          $set: {
            adresse: {
              ...rest,
            },
          },
        }
      );
    }
  }
};

export const updateMissionLocaleEffectifCurrentStatus = async () => {
  const cursor = organisationsDb().find({
    type: "MISSION_LOCALE",
  });

  while (await cursor.hasNext()) {
    const orga = await cursor.next();
    if (!orga) {
      continue;
    }
    const cursor2 = missionLocaleEffectifsDb().find({ mission_locale_id: orga._id });
    while (await cursor2.hasNext()) {
      const eff = await cursor2.next();
      if (!eff) {
        continue;
      }
      const effectif = await effectifsDb()
        .aggregate([
          {
            $unionWith: {
              coll: "effectifsDECA",
              pipeline: [{ $match: { _id: eff.effectif_id } }],
            },
          },
          {
            $match: {
              _id: eff.effectif_id,
            },
          },
          {
            $project: {
              parcours: "$_computed.statut.parcours",
            },
          },
        ])
        .next();
      if (!effectif || !effectif.parcours || effectif.parcours.length === 0) {
        continue;
      }

      const currentStatus =
        effectif.parcours.filter((statut) => statut.date <= new Date()).slice(-1)[0] || effectif.parcours.slice(-1)[0];

      if (currentStatus) {
        await missionLocaleEffectifsDb().updateOne(
          { _id: eff._id },
          {
            $set: {
              "current_status.value": currentStatus.valeur,
              "current_status.date": currentStatus.date,
            },
          }
        );
      }
    }
  }
};

export const updateMissionLocaleAdresseFromExternalData = async (
  data: Array<{ ml_id: number; corrected_cp: string }>
) => {
  for (let i = 0; i < data.length; i++) {
    const { ml_id, corrected_cp } = data[i];
    const { mission_locale_id, ...rest } = await getAndFormatCommuneFromCode(null, corrected_cp);

    await organisationsDb().updateOne(
      { type: "MISSION_LOCALE", ml_id: ml_id },
      {
        $set: {
          adresse: {
            ...rest,
          },
        },
      }
    );
  }
  return data;
};

export const hydrateMissionLocaleEffectifDateRupture = async () => {
  const BATCH_SIZE = 1000;

  let batch: Array<{ _id: ObjectId; date_rupture: Date }> = [];

  const processBatch = (currentBatch: Array<{ _id: ObjectId; date_rupture: Date }>) => {
    if (currentBatch.length === 0) {
      return;
    }

    try {
      const mapped = currentBatch.map(({ _id, date_rupture }) => ({
        updateOne: {
          filter: { _id },
          update: {
            $set: {
              date_rupture,
            },
          },
        },
      }));

      return missionLocaleEffectifsDb().bulkWrite(mapped);
    } catch (e) {
      captureException(e);
    }
  };

  const cursor = missionLocaleEffectifsDb().find({ date_rupture: { $exists: false } });

  while (await cursor.hasNext()) {
    const eff = await cursor.next();
    if (!eff) {
      continue;
    }
    const parcours = eff?.effectif_snapshot?._computed?.statut?.parcours;

    if (!parcours || parcours.length === 0) {
      continue;
    }

    const lastRuptureDate = parcours.findLast((statut) => statut.valeur === "RUPTURANT")?.date;

    lastRuptureDate &&
      batch.push({
        _id: eff._id,
        date_rupture: lastRuptureDate,
      });

    if (batch.length === BATCH_SIZE) {
      await processBatch(batch);
      batch = [];
    }
  }

  await processBatch(batch);
};

export const updateMissionLocaleEffectifActivationDate = async () => {
  const cursor = organisationsDb().find({
    type: "MISSION_LOCALE",
    activated_at: { $ne: null },
  });

  while (await cursor.hasNext()) {
    const ml = (await cursor.next()) as IOrganisationMissionLocale;

    await missionLocaleEffectifsDb().updateMany(
      { mission_locale_id: ml._id },
      {
        $set: {
          "computed.mission_locale.activated_at": ml.activated_at,
        },
      }
    );
  }
};

export const softDeleteDoublonEffectifML = async () => {
  const data = await missionLocaleEffectifsDb()
    .aggregate([
      {
        $group: {
          _id: "$effectif_id",
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
    ])
    .toArray();

  for (const doc of data) {
    const mlEff = await missionLocaleEffectifsDb()
      .find({ effectif_id: doc._id })
      .sort({ created_at: -1 })
      .limit(1)
      .next();

    if (mlEff) {
      checkMissionLocaleEffectifDoublon(mlEff._id, doc._id);
    }
  }
};

export const updateMissionLocaleEffectifSnapshot = async (activationDate: Date) => {
  const cursor = organisationsDb().find({
    type: "MISSION_LOCALE",
    activated_at: { $ne: null },
  });
  while (await cursor.hasNext()) {
    const orga = await cursor.next();
    if (!orga) {
      continue;
    }

    await activateMissionLocale(orga._id, activationDate);
  }
};

export const updateNotActivatedMissionLocaleEffectifSnapshot = async () => {
  const cursor = organisationsDb().find({
    type: "MISSION_LOCALE",
    activated_at: null,
  });

  while (await cursor.hasNext()) {
    const orga = (await cursor.next()) as IOrganisationMissionLocale;
    if (!orga) {
      continue;
    }
    await updateEffectifMissionLocaleSnapshotAtMLActivation(orga._id);
  }
};

export const hydrateMissionLocaleStats = async () => {
  const mls = (await organisationsDb().find({ type: "MISSION_LOCALE" }).toArray()) as Array<IOrganisationMissionLocale>;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const ml of mls) {
    await createOrUpdateMissionLocaleStats(ml._id, today);
    await createOrUpdateMissionLocaleStats(ml._id, yesterday);
  }
};

export const hydrateDailyMissionLocaleStats = async () => {
  await missionLocaleStatsDb().deleteMany({});

  const mls = (await organisationsDb().find({ type: "MISSION_LOCALE" }).toArray()) as Array<IOrganisationMissionLocale>;

  const firstDate = await missionLocaleEffectifsDb().findOne({}, { sort: { created_at: 1 } });

  if (!firstDate) {
    return;
  }

  const startDate = firstDate.created_at;

  const getAllDateSinceStartingDate = (start: Date): Date[] => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const dates: Date[] = [];
    const currentDate = new Date(start);
    currentDate.setUTCHours(0, 0, 0, 0);
    while (currentDate <= today) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  const allDates = getAllDateSinceStartingDate(startDate);

  for (const date of allDates) {
    const mapped = mls.map((ml) => () => {
      return createOrUpdateMissionLocaleStats(new ObjectId(ml._id), date);
    });

    await Promise.allSettled(mapped.map((fn) => fn()));
  }
};

export const backfillIdentifiantNormalise = async () => {
  const BATCH_SIZE = 1000;

  type BatchItem = {
    updateOne: {
      filter: { _id: ObjectId };
      update: { $set: { identifiant_normalise: { nom: string; prenom: string; date_de_naissance: Date } } };
    };
  };

  let batch: BatchItem[] = [];

  const processBatch = async (currentBatch: BatchItem[]) => {
    if (currentBatch.length === 0) {
      return;
    }

    try {
      return await missionLocaleEffectifsDb().bulkWrite(currentBatch);
    } catch (e) {
      captureException(e);
    }
  };

  const cursor = missionLocaleEffectifsDb().find({
    identifiant_normalise: { $exists: false },
    "effectif_snapshot.apprenant.nom": { $exists: true, $ne: null },
    "effectif_snapshot.apprenant.prenom": { $exists: true, $ne: null },
    "effectif_snapshot.apprenant.date_de_naissance": { $exists: true, $ne: null },
  });

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (!doc) continue;

    const apprenant = doc.effectif_snapshot?.apprenant;
    if (!apprenant?.nom || !apprenant?.prenom || !apprenant?.date_de_naissance) continue;

    batch.push({
      updateOne: {
        filter: { _id: doc._id },
        update: {
          $set: {
            identifiant_normalise: normalisePersonIdentifiant({
              nom: apprenant.nom,
              prenom: apprenant.prenom,
              date_de_naissance: apprenant.date_de_naissance,
            }),
          },
        },
      },
    });

    if (batch.length >= BATCH_SIZE) {
      await processBatch(batch);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await processBatch(batch);
  }
};
