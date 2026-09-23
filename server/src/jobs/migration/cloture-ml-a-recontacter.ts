import { captureException } from "@sentry/node";
import { addMonths, differenceInDays, max } from "date-fns";
import type { AnyBulkWriteOperation } from "mongodb";
import { ObjectId } from "mongodb";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import type { IMissionLocaleEffectif } from "shared/models/data/missionLocaleEffectif.model";
import type { IMissionLocaleEffectifLog } from "shared/models/data/missionLocaleEffectifLog.model";

import { createOrUpdateMissionLocaleStats } from "@/common/actions/mission-locale/mission-locale-stats.actions";
import parentLogger from "@/common/logger";
import { missionLocaleEffectifsDb, missionLocaleEffectifsLogDb } from "@/common/model/collections";

const logger = parentLogger.child({ module: "job:migrate:ml-cloture-a-recontacter" });

const BATCH_SIZE = 500;

// 31/05/2026 23:59:59.999, heure de Paris
const DATE_LIMITE_PASSAGE = new Date("2026-05-31T21:59:59.999Z");

const DELAI_CLOTURE_MOIS = 2;

const buildCommentaire = (jours: number) =>
  `Le jeune n’a pas répondu aux tentatives de contact de la Mission Locale depuis ${jours} jours. Son dossier a été clôturé automatiquement.`;

interface ClotureOptions {
  dryRun: boolean;
}

interface Candidat {
  _id: ObjectId;
  mlId: string;
  datePassage: Date;
  dateCloture: Date;
}

/**
 * Clôture en « injoignable après relances » les dossiers restés à recontacter depuis un passage
 * antérieur au 01/06/2026. La clôture est datée deux mois après le passage, ou à la dernière
 * action ML si elle est postérieure, pour garder un historique chronologique.
 */
export async function clotureMlARecontacter({ dryRun }: ClotureOptions) {
  const report = {
    dossiers: 0,
    updated: 0,
    logsInserted: 0,
    parMissionLocale: {} as Record<string, number>,
    batchesEnErreur: 0,
    logsEnErreur: [] as string[],
    statsEnErreur: [] as string[],
  };
  const missionLocalesModifiees = new Set<string>();

  const cursor = missionLocaleEffectifsDb().find(
    {
      situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR,
      soft_deleted: { $ne: true },
      date_dernier_passage_a_recontacter: { $lte: DATE_LIMITE_PASSAGE },
    },
    {
      projection: { _id: 1, mission_locale_id: 1, date_dernier_passage_a_recontacter: 1, date_derniere_action_ml: 1 },
    }
  );

  let batch: Candidat[] = [];

  const flush = async () => {
    if (dryRun || batch.length === 0) {
      batch = [];
      return;
    }

    const ops: AnyBulkWriteOperation<IMissionLocaleEffectif>[] = batch.map((c) => ({
      updateOne: {
        filter: { _id: c._id, situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR },
        update: {
          $set: {
            situation: SITUATION_ENUM.INJOIGNABLE_APRES_RELANCES,
            date_traitement: c.dateCloture,
            updated_at: new Date(),
          },
        },
      },
    }));

    try {
      await missionLocaleEffectifsDb().bulkWrite(ops, { ordered: false });
    } catch (error) {
      report.batchesEnErreur++;
      logger.error({ error }, "Échec partiel du lot de clôture");
      captureException(error);
    }

    const candidatById = new Map(batch.map((c) => [c._id.toString(), c]));
    const clotures = await missionLocaleEffectifsDb()
      .find(
        { _id: { $in: batch.map((c) => c._id) }, situation: SITUATION_ENUM.INJOIGNABLE_APRES_RELANCES },
        { projection: { _id: 1, date_traitement: 1 } }
      )
      .toArray();
    const logs: IMissionLocaleEffectifLog[] = [];
    for (const effectif of clotures) {
      const candidat = candidatById.get(effectif._id.toString());
      if (!candidat || effectif.date_traitement?.getTime() !== candidat.dateCloture.getTime()) {
        continue;
      }
      missionLocalesModifiees.add(candidat.mlId);
      logs.push({
        _id: new ObjectId(),
        mission_locale_effectif_id: candidat._id,
        situation: SITUATION_ENUM.INJOIGNABLE_APRES_RELANCES,
        commentaires: buildCommentaire(differenceInDays(candidat.dateCloture, candidat.datePassage)),
        created_at: candidat.dateCloture,
        created_by: null,
        read_by: [],
      });
    }
    report.updated += logs.length;

    if (logs.length > 0) {
      try {
        const inserted = await missionLocaleEffectifsLogDb().insertMany(logs, { ordered: false });
        report.logsInserted += inserted.insertedCount;
      } catch (error) {
        const ids = logs.map((l) => l.mission_locale_effectif_id.toString());
        report.logsEnErreur.push(...ids);
        logger.error({ error, ids }, "Dossiers clôturés sans log de clôture");
        captureException(error);
      }
    }

    batch = [];
  };

  for await (const effectif of cursor) {
    const datePassage = effectif.date_dernier_passage_a_recontacter as Date;
    const dateCloture = effectif.date_derniere_action_ml
      ? max([addMonths(datePassage, DELAI_CLOTURE_MOIS), effectif.date_derniere_action_ml])
      : addMonths(datePassage, DELAI_CLOTURE_MOIS);
    const mlId = effectif.mission_locale_id.toString();

    report.dossiers++;
    report.parMissionLocale[mlId] = (report.parMissionLocale[mlId] ?? 0) + 1;
    batch.push({ _id: effectif._id, mlId, datePassage, dateCloture });

    if (batch.length >= BATCH_SIZE) {
      await flush();
    }
  }
  await flush();

  for (const mlId of missionLocalesModifiees) {
    try {
      await createOrUpdateMissionLocaleStats(new ObjectId(mlId));
    } catch (error) {
      report.statsEnErreur.push(mlId);
      logger.error({ error, mlId }, "Échec du recalcul des stats de la Mission Locale");
      captureException(error);
    }
  }

  logger.info(
    { dryRun, ...report },
    dryRun ? "Clôture des dossiers à recontacter simulée (dry-run)" : "Clôture des dossiers à recontacter terminée"
  );
  return report;
}
