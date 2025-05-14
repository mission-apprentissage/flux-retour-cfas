import { ObjectId } from "mongodb";
import { CODES_STATUT_APPRENANT } from "shared/constants";
import { IEffectif, IOrganisationMissionLocale } from "shared/models";
import { IEffectifDECA } from "shared/models/data/effectifsDECA.model";

import { updateEffectifStatut } from "@/common/actions/effectifs.statut.actions";
import { getAndFormatCommuneFromCode } from "@/common/actions/engine/engine.actions";
import {
  createMissionLocaleSnapshot,
  getAllEffectifForMissionLocaleCursor,
  updateOrDeleteMissionLocaleSnapshot,
} from "@/common/actions/mission-locale/mission-locale.actions";
import { apiAlternanceClient } from "@/common/apis/apiAlternance/client";
import { effectifsDb, effectifsQueueDb, missionLocaleEffectifsDb, organisationsDb } from "@/common/model/collections";

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

export const updateEffectifMissionLocaleSnapshotAtActivation = async (missionLocaleId: ObjectId) => {
  const cursor = missionLocaleEffectifsDb().find({
    mission_locale_id: missionLocaleId,
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
    updateOrDeleteMissionLocaleSnapshot(upToDateEffectif[0]);
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
