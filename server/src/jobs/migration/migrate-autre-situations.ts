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

import { normalisePersonIdentifiant } from "@/common/actions/personV2/personV2.actions";
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
  situation_autre?: string;
  commentaires?: string;
  probleme_type?: string;
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
  softDeletedSansKeeper: string[];
  redirigesVersKeeper: string[];
  dejaCibles: string[];
  nonModifies: string[];
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
  softDeletedSansKeeper: [],
  redirigesVersKeeper: [],
  dejaCibles: [],
  nonModifies: [],
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

const PROJECTION = {
  _id: 1,
  situation: 1,
  soft_deleted: 1,
  connaissance_ml: 1,
  situation_autre: 1,
  commentaires: 1,
  probleme_type: 1,
  probleme_detail: 1,
  "effectif_snapshot.apprenant.nom": 1,
  "effectif_snapshot.apprenant.prenom": 1,
  "effectif_snapshot.apprenant.date_de_naissance": 1,
} as const;

type EffectifCharge = Pick<
  IMissionLocaleEffectif,
  | "_id"
  | "situation"
  | "soft_deleted"
  | "connaissance_ml"
  | "situation_autre"
  | "commentaires"
  | "probleme_type"
  | "probleme_detail"
  | "effectif_snapshot"
>;

type Identifiant = { nom: string; prenom: string; date_de_naissance: Date };

const identifiantDe = (effectif: EffectifCharge): Identifiant | null => {
  const apprenant = effectif.effectif_snapshot?.apprenant;
  if (!apprenant?.nom || !apprenant?.prenom || !apprenant?.date_de_naissance) return null;
  return normalisePersonIdentifiant({
    nom: apprenant.nom,
    prenom: apprenant.prenom,
    date_de_naissance: apprenant.date_de_naissance,
  });
};

const cleIdentifiant = (i: Identifiant) => `${i.nom}|${i.prenom}|${i.date_de_naissance.getTime()}`;

const chargerKeepers = async (supprimes: EffectifCharge[]) => {
  const identifiants = new Map<string, Identifiant>();
  const cleParSupprime = new Map<string, string>();
  for (const supprime of supprimes) {
    const identifiant = identifiantDe(supprime);
    if (!identifiant) continue;
    const cle = cleIdentifiant(identifiant);
    identifiants.set(cle, identifiant);
    cleParSupprime.set(supprime._id.toString(), cle);
  }
  if (identifiants.size === 0) return new Map<string, EffectifCharge>();

  const keepers = (await missionLocaleEffectifsDb()
    .find(
      {
        soft_deleted: { $ne: true },
        $or: [...identifiants.values()].map((i) => ({
          "identifiant_normalise.nom": i.nom,
          "identifiant_normalise.prenom": i.prenom,
          "identifiant_normalise.date_de_naissance": i.date_de_naissance,
        })),
      },
      { projection: { ...PROJECTION, identifiant_normalise: 1 } }
    )
    .toArray()) as Array<EffectifCharge & { identifiant_normalise?: Identifiant | null }>;
  const keeperParCle = new Map(
    keepers.flatMap((k) => (k.identifiant_normalise ? [[cleIdentifiant(k.identifiant_normalise), k] as const] : []))
  );

  const keeperParSupprime = new Map<string, EffectifCharge>();
  for (const [supprimeId, cle] of cleParSupprime) {
    const keeper = keeperParCle.get(cle);
    if (keeper) keeperParSupprime.set(supprimeId, keeper);
  }
  return keeperParSupprime;
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
      : ((await missionLocaleEffectifsDb()
          .find({ _id: { $in: idsToLoad } }, { projection: PROJECTION })
          .toArray()) as EffectifCharge[]);
  const effectifById = new Map(existing.map((e) => [e._id.toString(), e]));
  const keeperParSupprime = await chargerKeepers(existing.filter((e) => e.soft_deleted === true));
  const now = new Date();

  // 3. Construit les opérations + logs ; rien n'est $unset pour préserver la donnée existante.
  let pending: {
    _id: ObjectId;
    op: AnyBulkWriteOperation<IMissionLocaleEffectif>;
    log: IMissionLocaleEffectifLog;
  }[] = [];
  const cibles = new Set<string>();

  const flush = async () => {
    if (pending.length === 0) return;

    if (dryRun) {
      report.pendingUpdates += pending.length;
      pending = [];
      return;
    }

    const result = await missionLocaleEffectifsDb().bulkWrite(
      pending.map((p) => p.op),
      { ordered: false }
    );
    report.matched += result.matchedCount ?? 0;
    report.updated += result.modifiedCount ?? 0;

    const situationsApres = new Map(
      (
        await missionLocaleEffectifsDb()
          .find({ _id: { $in: pending.map((p) => p._id) } }, { projection: { _id: 1, situation: 1 } })
          .toArray()
      ).map((e) => [e._id.toString(), e.situation])
    );
    const logs: IMissionLocaleEffectifLog[] = [];
    for (const p of pending) {
      if (situationsApres.get(p._id.toString()) === p.log.situation) {
        logs.push(p.log);
      } else {
        report.nonModifies.push(p._id.toString());
      }
    }

    if (logs.length > 0) {
      const insertResult = await missionLocaleEffectifsLogDb().insertMany(logs, { ordered: false });
      report.logsInserted += insertResult.insertedCount ?? logs.length;
    }

    pending = [];
  };

  for (const { row, _id, mapping, motif } of validRows) {
    const idKey = _id.toString();

    const charge = effectifById.get(idKey);

    if (!charge) {
      report.notFound.push(row._id);
      continue;
    }

    let effectif = charge;
    if (charge.soft_deleted === true) {
      const keeper = keeperParSupprime.get(idKey);
      if (!keeper) {
        report.softDeletedSansKeeper.push(row._id);
        continue;
      }
      effectif = keeper;
      report.redirigesVersKeeper.push(`${row._id} (keeper ${keeper._id.toString()})`);
    }

    const cibleKey = effectif._id.toString();
    if (cibles.has(cibleKey)) {
      report.dejaCibles.push(row._id);
      continue;
    }

    const currentSituation = effectif.situation;

    if (currentSituation == null) {
      // Effectif sans situation: la donnée est intacte, on ne migre pas.
      report.noSituation.push(row._id);
      continue;
    }

    if (currentSituation !== SITUATION_ENUM.AUTRE) {
      report.alreadyMigrated.push(`${row._id} (current=${currentSituation})`);
      continue;
    }

    cibles.add(cibleKey);

    const connaissanceMl =
      mapping.connaissance_ml === CONNAISSANCE_ML_ENUM.CONNU_NON_ACCOMPAGNE &&
      effectif.connaissance_ml === CONNAISSANCE_ML_ENUM.DEJA_ACCOMPAGNE_ACTIVEMENT
        ? effectif.connaissance_ml
        : mapping.connaissance_ml;

    const setObject: Record<string, unknown> = {
      situation: mapping.situation,
    };
    if (connaissanceMl !== undefined) {
      setObject.connaissance_ml = connaissanceMl;
    }
    if (mapping.deja_connu !== undefined) {
      setObject.deja_connu = mapping.deja_connu;
    }
    if (mapping.situation === SITUATION_ENUM.CONTACTE_SANS_RETOUR) {
      setObject.date_traitement = null;
      setObject.date_dernier_passage_a_recontacter = now;
    }

    // Le log capture le snapshot pré-migration (situation_autre, commentaires, probleme_*)
    // pour ne rien perdre — l'effectif lui-même conserve aussi ces champs (pas de $unset).
    const situationAutre = effectif.situation_autre || row.situation_autre?.trim();
    const commentaires = effectif.commentaires || row.commentaires?.trim();
    const problemeType = effectif.probleme_type ?? parseProblemeType(row.probleme_type);
    const problemeDetail = effectif.probleme_detail;

    pending.push({
      _id: effectif._id,
      op: {
        updateOne: {
          filter: { _id: effectif._id, situation: SITUATION_ENUM.AUTRE },
          update: { $set: setObject },
        },
      },
      log: {
        _id: new ObjectId(),
        mission_locale_effectif_id: effectif._id,
        situation: mapping.situation,
        ...(connaissanceMl !== undefined ? { connaissance_ml: connaissanceMl } : {}),
        ...(mapping.deja_connu !== undefined ? { deja_connu: mapping.deja_connu } : {}),
        ...(situationAutre ? { situation_autre: situationAutre } : {}),
        ...(commentaires ? { commentaires } : {}),
        ...(problemeType ? { probleme_type: problemeType } : {}),
        ...(problemeDetail ? { probleme_detail: problemeDetail } : {}),
        created_at: now,
        created_by: null,
        read_by: [],
      },
    });

    report.byMotif[motif] = (report.byMotif[motif] ?? 0) + 1;

    if (pending.length >= BATCH_SIZE) {
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
      softDeletedSansKeeper: report.softDeletedSansKeeper.length,
      redirigesVersKeeper: report.redirigesVersKeeper.length,
      dejaCibles: report.dejaCibles.length,
      nonModifies: report.nonModifies.length,
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
  if (report.softDeletedSansKeeper.length > 0) {
    logger.warn(
      { ids: report.softDeletedSansKeeper, total: report.softDeletedSansKeeper.length },
      "IDs soft-deleted sans dossier conservé retrouvé — ignorés"
    );
  }
  if (report.redirigesVersKeeper.length > 0) {
    logger.info(
      { ids: report.redirigesVersKeeper, total: report.redirigesVersKeeper.length },
      "IDs soft-deleted requalifiés sur leur dossier conservé"
    );
  }
  if (report.dejaCibles.length > 0) {
    logger.warn(
      { ids: report.dejaCibles, total: report.dejaCibles.length },
      "IDs dont le dossier est déjà requalifié par une autre ligne — ignorés"
    );
  }
  if (report.nonModifies.length > 0) {
    logger.warn(
      { ids: report.nonModifies, total: report.nonModifies.length },
      "Dossiers modifiés pendant le passage — ni requalifiés ni journalisés"
    );
  }

  return report;
}
