import type { AnyBulkWriteOperation } from "mongodb";
import { ObjectId } from "mongodb";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import type { IMissionLocaleEffectif } from "shared/models/data/missionLocaleEffectif.model";

import parentLogger from "@/common/logger";
import { missionLocaleEffectifsDb, missionLocaleEffectifsLogDb } from "@/common/model/collections";

const logger = parentLogger.child({ module: "job:migrate:ml-suivi-dates" });

const BATCH_SIZE = 500;

interface LogAggregates {
  _id: ObjectId;
  derniere_action: Date | null;
  dernier_recontact: Date | null;
  dernier_traitement: Date | null;
}

const isEventNull = { $eq: [{ $ifNull: ["$event", null] }, null] };
const situationIs = (values: (SITUATION_ENUM | null)[]) => ({ $in: [{ $ifNull: ["$situation", null] }, values] });

const isTreatedSituation = (situation: IMissionLocaleEffectif["situation"]) =>
  situation != null && situation !== SITUATION_ENUM.CONTACTE_SANS_RETOUR;

/**
 * Reconstitue les dates de suivi des dossiers antérieurs à computeSuiviDatesSet, depuis
 * missionLocaleEffectifLog. Ne remplit que les champs vides : une date posée au fil de l'eau
 * fait foi. Idempotent.
 */
export async function backfillMlSuiviDates() {
  const report = { groupes: 0, updatedFromLogs: 0, fallbackTraitement: 0, fallbackRecontact: 0 };

  const cursor = missionLocaleEffectifsLogDb().aggregate<LogAggregates>(
    [
      {
        $group: {
          _id: "$mission_locale_effectif_id",
          derniere_action: { $max: { $cond: [isEventNull, "$created_at", null] } },
          dernier_recontact: {
            $max: { $cond: [situationIs([SITUATION_ENUM.CONTACTE_SANS_RETOUR]), "$created_at", null] },
          },
          dernier_traitement: {
            $max: {
              $cond: [
                { $and: [{ $not: situationIs([null]) }, { $not: situationIs([SITUATION_ENUM.CONTACTE_SANS_RETOUR]) }] },
                "$created_at",
                null,
              ],
            },
          },
        },
      },
    ],
    { allowDiskUse: true }
  );

  let batch: LogAggregates[] = [];

  const flush = async () => {
    if (batch.length === 0) {
      return;
    }
    const effectifs = await missionLocaleEffectifsDb()
      .find(
        { _id: { $in: batch.map((b) => b._id) } },
        {
          projection: {
            situation: 1,
            date_traitement: 1,
            date_dernier_passage_a_recontacter: 1,
            date_derniere_action_ml: 1,
          },
        }
      )
      .toArray();
    const effectifById = new Map(effectifs.map((e) => [e._id.toString(), e]));

    const ops: AnyBulkWriteOperation<IMissionLocaleEffectif>[] = [];
    for (const agg of batch) {
      const effectif = effectifById.get(agg._id.toString());
      if (!effectif) {
        continue;
      }
      // une date effacée par un reset admin ne doit pas être ressuscitée depuis les logs
      const set: Partial<IMissionLocaleEffectif> = {
        ...(agg.derniere_action && effectif.date_derniere_action_ml == null
          ? { date_derniere_action_ml: agg.derniere_action }
          : {}),
        ...(agg.dernier_recontact && effectif.date_dernier_passage_a_recontacter == null
          ? { date_dernier_passage_a_recontacter: agg.dernier_recontact }
          : {}),
        ...(agg.dernier_traitement && effectif.date_traitement == null && isTreatedSituation(effectif.situation)
          ? { date_traitement: agg.dernier_traitement }
          : {}),
      };
      if (Object.keys(set).length > 0) {
        ops.push({ updateOne: { filter: { _id: agg._id }, update: { $set: set } } });
      }
    }

    if (ops.length > 0) {
      const result = await missionLocaleEffectifsDb().bulkWrite(ops, { ordered: false });
      report.updatedFromLogs += result.matchedCount ?? 0;
    }
    batch = [];
  };

  for await (const agg of cursor) {
    report.groupes++;
    batch.push(agg);
    if (batch.length >= BATCH_SIZE) {
      await flush();
    }
  }
  await flush();

  // dossiers sans log exploitable : approximation par updated_at
  const fallbackTraitement = await missionLocaleEffectifsDb().updateMany(
    { situation: { $nin: [null, SITUATION_ENUM.CONTACTE_SANS_RETOUR] }, date_traitement: null },
    [{ $set: { date_traitement: { $ifNull: ["$updated_at", "$created_at"] } } }]
  );
  report.fallbackTraitement = fallbackTraitement.modifiedCount;

  const fallbackRecontact = await missionLocaleEffectifsDb().updateMany(
    { situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR, date_dernier_passage_a_recontacter: null },
    [{ $set: { date_dernier_passage_a_recontacter: { $ifNull: ["$updated_at", "$created_at"] } } }]
  );
  report.fallbackRecontact = fallbackRecontact.modifiedCount;

  logger.info(report, "Backfill des dates de suivi ML terminé");
  return report;
}
