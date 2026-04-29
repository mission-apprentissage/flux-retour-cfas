import { readFileSync } from "node:fs";

import { ObjectId } from "bson";
import { parse } from "csv-parse/sync";
import type { AnyBulkWriteOperation } from "mongodb";
import {
  CONNAISSANCE_ML_ENUM,
  PROBLEME_TYPE_ENUM,
  SITUATION_ENUM,
} from "shared/models/data/missionLocaleEffectif.model";
import type { IMissionLocaleEffectif } from "shared/models/data/missionLocaleEffectif.model";
import type { IMissionLocaleEffectifLog } from "shared/models/data/missionLocaleEffectifLog.model";

import parentLogger from "@/common/logger";
import { missionLocaleEffectifsDb, missionLocaleEffectifsLogDb } from "@/common/model/collections";

const logger = parentLogger.child({ module: "job:migrate:autre-situations" });

const BATCH_SIZE = 200;

interface MigrateOptions {
  csvPath: string;
  dryRun: boolean;
}

interface CsvRow {
  _id: string;
  situation_autre: string;
  commentaires: string;
  probleme_type: string;
  nouveau_motif: string;
}

interface SituationPayload {
  situation: SITUATION_ENUM;
  connaissance_ml?: CONNAISSANCE_ML_ENUM;
  deja_connu?: boolean;
}

const MOTIF_MAPPING: Record<string, SituationPayload | null> = {
  "en projet sécurisé": { situation: SITUATION_ENUM.NOUVEAU_PROJET },
  "ne veut pas d'accompagnement": { situation: SITUATION_ENUM.NE_VEUT_PAS_ACCOMPAGNEMENT },
  "à recontacter": { situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR },
  injoignable: { situation: SITUATION_ENUM.INJOIGNABLE_APRES_RELANCES },
  "RDV pris jeune non connu": {
    situation: SITUATION_ENUM.RDV_PRIS,
    connaissance_ml: CONNAISSANCE_ML_ENUM.NON_CONNU,
    deja_connu: false,
  },
  "RDV pris jeune connu": {
    situation: SITUATION_ENUM.RDV_PRIS,
    connaissance_ml: CONNAISSANCE_ML_ENUM.CONNU_NON_ACCOMPAGNE,
    deja_connu: true,
  },
  // motif "autre" -> AUTRE reste en place; le moteur de stats v2 bucket via probleme_type.
  autre: null,
};

interface Report {
  totalRows: number;
  invalidIds: number;
  notFound: string[];
  noSituation: string[];
  alreadyMigrated: string[];
  unknownMotif: Record<string, number>;
  noOpAutre: number;
  pendingUpdates: number;
  matched: number;
  updated: number;
  logsInserted: number;
  byMotif: Record<string, number>;
}

const emptyReport = (): Report => ({
  totalRows: 0,
  invalidIds: 0,
  notFound: [],
  noSituation: [],
  alreadyMigrated: [],
  unknownMotif: {},
  noOpAutre: 0,
  pendingUpdates: 0,
  matched: 0,
  updated: 0,
  logsInserted: 0,
  byMotif: {},
});

const PROBLEME_TYPE_VALUES = new Set<string>(Object.values(PROBLEME_TYPE_ENUM));

const parseProblemeType = (raw: string | undefined): PROBLEME_TYPE_ENUM | undefined => {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  return PROBLEME_TYPE_VALUES.has(trimmed) ? (trimmed as PROBLEME_TYPE_ENUM) : undefined;
};

export async function migrateAutreSituations({ csvPath, dryRun }: MigrateOptions) {
  logger.info({ csvPath, dryRun }, "Début du job migrate:autre-situations");

  const raw = readFileSync(csvPath, "utf8");
  const rows: CsvRow[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const report = emptyReport();
  report.totalRows = rows.length;

  // 1. Pré-validation des lignes + collecte des _id à charger en une seule requête.
  const validRows: { row: CsvRow; _id: ObjectId; mapping: SituationPayload; motif: string }[] = [];
  const idsToLoad: ObjectId[] = [];

  for (const row of rows) {
    const motif = row.nouveau_motif?.trim() ?? "";

    if (!ObjectId.isValid(row._id)) {
      report.invalidIds++;
      continue;
    }

    if (!(motif in MOTIF_MAPPING)) {
      report.unknownMotif[motif] = (report.unknownMotif[motif] ?? 0) + 1;
      continue;
    }

    const mapping = MOTIF_MAPPING[motif];

    if (mapping === null) {
      report.noOpAutre++;
      report.byMotif[motif] = (report.byMotif[motif] ?? 0) + 1;
      continue;
    }

    const _id = new ObjectId(row._id);
    idsToLoad.push(_id);
    validRows.push({ row, _id, mapping, motif });
  }

  // 2. Précharge l'état actuel en une seule requête.
  const existing =
    idsToLoad.length === 0
      ? []
      : await missionLocaleEffectifsDb()
          .find({ _id: { $in: idsToLoad } }, { projection: { _id: 1, situation: 1 } })
          .toArray();
  const situationById = new Map<string, IMissionLocaleEffectif["situation"]>();
  for (const e of existing) {
    situationById.set(e._id.toString(), e.situation);
  }

  // 3. Construit les opérations + logs ; rien n'est $unset pour préserver la donnée existante.
  let pendingEffectifOps: AnyBulkWriteOperation<IMissionLocaleEffectif>[] = [];
  let pendingLogDocs: IMissionLocaleEffectifLog[] = [];

  const flush = async () => {
    const opsCount = pendingEffectifOps.length;
    const logsCount = pendingLogDocs.length;

    if (dryRun) {
      report.pendingUpdates += opsCount;
      pendingEffectifOps = [];
      pendingLogDocs = [];
      return;
    }

    if (opsCount > 0) {
      const result = await missionLocaleEffectifsDb().bulkWrite(pendingEffectifOps, { ordered: false });
      report.matched += result.matchedCount ?? 0;
      report.updated += result.modifiedCount ?? 0;
      if ((result.modifiedCount ?? 0) !== opsCount) {
        logger.warn(
          {
            attempted: opsCount,
            matched: result.matchedCount,
            modified: result.modifiedCount,
          },
          "bulkWrite a modifié moins de documents que prévu (situation déjà migrée entre-temps?)"
        );
      }
    }

    if (logsCount > 0) {
      const insertResult = await missionLocaleEffectifsLogDb().insertMany(pendingLogDocs, { ordered: false });
      report.logsInserted += insertResult.insertedCount ?? logsCount;
    }

    pendingEffectifOps = [];
    pendingLogDocs = [];
  };

  for (const { row, _id, mapping, motif } of validRows) {
    const idKey = _id.toString();

    if (!situationById.has(idKey)) {
      report.notFound.push(row._id);
      continue;
    }

    const currentSituation = situationById.get(idKey);

    if (currentSituation == null) {
      // Effectif sans situation: la donnée est intacte, on ne migre pas.
      report.noSituation.push(row._id);
      continue;
    }

    if (currentSituation !== SITUATION_ENUM.AUTRE) {
      report.alreadyMigrated.push(`${row._id} (current=${currentSituation})`);
      continue;
    }

    const setObject: Record<string, unknown> = {
      situation: mapping.situation,
      updated_at: new Date(),
    };
    if (mapping.connaissance_ml !== undefined) {
      setObject.connaissance_ml = mapping.connaissance_ml;
    }
    if (mapping.deja_connu !== undefined) {
      setObject.deja_connu = mapping.deja_connu;
    }

    pendingEffectifOps.push({
      updateOne: {
        filter: { _id, situation: SITUATION_ENUM.AUTRE },
        update: { $set: setObject },
      },
    });

    // Le log capture le snapshot pré-migration (situation_autre, commentaires, probleme_type)
    // pour ne rien perdre — l'effectif lui-même conserve aussi ces champs (pas de $unset).
    const csvSituationAutre = row.situation_autre?.trim();
    const csvCommentaires = row.commentaires?.trim();
    const csvProblemeType = parseProblemeType(row.probleme_type);

    const logDoc: IMissionLocaleEffectifLog = {
      _id: new ObjectId(),
      mission_locale_effectif_id: _id,
      situation: mapping.situation,
      ...(mapping.connaissance_ml !== undefined ? { connaissance_ml: mapping.connaissance_ml } : {}),
      ...(mapping.deja_connu !== undefined ? { deja_connu: mapping.deja_connu } : {}),
      ...(csvSituationAutre ? { situation_autre: csvSituationAutre } : {}),
      ...(csvCommentaires ? { commentaires: csvCommentaires } : {}),
      ...(csvProblemeType ? { probleme_type: csvProblemeType } : {}),
      created_at: new Date(),
      created_by: null,
      read_by: [],
    };
    pendingLogDocs.push(logDoc);

    report.byMotif[motif] = (report.byMotif[motif] ?? 0) + 1;

    if (pendingEffectifOps.length >= BATCH_SIZE) {
      await flush();
    }
  }

  await flush();

  logger.info(
    {
      dryRun,
      totalRows: report.totalRows,
      pendingUpdates: report.pendingUpdates,
      matched: report.matched,
      updated: report.updated,
      logsInserted: report.logsInserted,
      noOpAutre: report.noOpAutre,
      notFound: report.notFound.length,
      noSituation: report.noSituation.length,
      alreadyMigrated: report.alreadyMigrated.length,
      invalidIds: report.invalidIds,
      unknownMotif: report.unknownMotif,
      byMotif: report.byMotif,
    },
    dryRun ? "Migration simulée (dry-run)" : "Migration terminée"
  );

  if (report.notFound.length > 0) {
    logger.warn({ sample: report.notFound.slice(0, 20), total: report.notFound.length }, "IDs non trouvés en base");
  }
  if (report.noSituation.length > 0) {
    logger.warn(
      { sample: report.noSituation.slice(0, 20), total: report.noSituation.length },
      "IDs sans situation en base — ignorés (pas AUTRE, pas migrés)"
    );
  }
  if (report.alreadyMigrated.length > 0) {
    logger.warn(
      { sample: report.alreadyMigrated.slice(0, 20), total: report.alreadyMigrated.length },
      "IDs déjà migrés (situation != AUTRE) — ignorés"
    );
  }

  return 0;
}
