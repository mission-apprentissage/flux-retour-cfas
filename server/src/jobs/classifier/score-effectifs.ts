import { ObjectId } from "bson";
import { IEffectif } from "shared/models/data/effectifs.model";

import parentLogger from "@/common/logger";
import { missionLocaleEffectifsDb } from "@/common/model/collections";
import { extractScoreInput, scoreEffectifs, type EffectifScoreInput } from "@/common/services/classifier";

const logger = parentLogger.child({
  module: "job:classifier:score-effectifs",
});

const BATCH_SIZE = 500;

interface ScoreExistingEffectifsOptions {
  dryRun: boolean;
  limit?: number;
}

export async function scoreExistingEffectifs({ dryRun, limit }: ScoreExistingEffectifsOptions) {
  logger.info({ dryRun, limit }, "Début du job classifier:score-effectifs");

  const cursor = missionLocaleEffectifsDb()
    .find({
      classification_reponse_appel: { $exists: false },
      soft_deleted: { $ne: true },
      situation: null,
    })
    .project<{ _id: ObjectId; effectif_snapshot: IEffectif }>({ _id: 1, effectif_snapshot: 1 });

  if (limit) {
    cursor.limit(limit);
  }

  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  let batch: { _id: ObjectId; effectif_snapshot: IEffectif }[] = [];

  for await (const doc of cursor) {
    batch.push(doc);

    if (batch.length >= BATCH_SIZE) {
      const result = await processBatch(batch, dryRun);
      totalProcessed += result.processed;
      totalSkipped += result.skipped;
      totalFailed += result.failed;
      batch = [];
    }
  }

  // Process remaining batch
  if (batch.length > 0) {
    const result = await processBatch(batch, dryRun);
    totalProcessed += result.processed;
    totalSkipped += result.skipped;
    totalFailed += result.failed;
  }

  logger.info(
    { totalProcessed, totalSkipped, totalFailed },
    `Job terminé - Scorés: ${totalProcessed}, Ignorés: ${totalSkipped}, Erreurs: ${totalFailed}`
  );

  return totalFailed > 0 && totalProcessed === 0 ? 1 : 0;
}

async function processBatch(batch: { _id: ObjectId; effectif_snapshot: IEffectif }[], dryRun: boolean) {
  const scorable: { index: number; _id: ObjectId; input: EffectifScoreInput }[] = [];
  let skipped = 0;

  for (let i = 0; i < batch.length; i++) {
    const input = extractScoreInput(batch[i].effectif_snapshot);
    if (input) {
      scorable.push({ index: i, _id: batch[i]._id, input });
    } else {
      skipped++;
    }
  }

  if (scorable.length === 0) {
    logger.info({ batchSize: batch.length, skipped }, "Batch entièrement ignoré (données manquantes)");
    return { processed: 0, skipped, failed: 0 };
  }

  if (dryRun) {
    logger.info({ scorable: scorable.length, skipped }, "Mode dry-run : batch non envoyé");
    return { processed: 0, skipped: skipped + scorable.length, failed: 0 };
  }

  try {
    const result = await scoreEffectifs(scorable.map((s) => s.input));
    const now = new Date();

    const bulkOps = scorable
      .map((s, i) => ({ s, score: result.scores[i] }))
      .filter(({ score }) => score != null)
      .map(({ s, score }) => ({
        updateOne: {
          filter: { _id: s._id },
          update: {
            $set: {
              classification_reponse_appel: {
                score,
                model: result.model,
                scored_at: now,
              },
            },
          },
        },
      }));

    if (bulkOps.length > 0) {
      await missionLocaleEffectifsDb().bulkWrite(bulkOps);
    }

    logger.info({ processed: scorable.length, skipped }, `Batch scoré avec succès`);
    return { processed: scorable.length, skipped, failed: 0 };
  } catch (err) {
    logger.error({ err, batchSize: scorable.length }, "Erreur lors du scoring du batch");
    return { processed: 0, skipped, failed: scorable.length };
  }
}
