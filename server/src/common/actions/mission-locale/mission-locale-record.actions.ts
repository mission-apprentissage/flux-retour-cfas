import Boom from "boom";
import { ObjectId } from "bson";
import { MongoServerError } from "mongodb";
import { IEffectif, IOrganisationMissionLocale } from "shared/models";
import { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import { CfaEffectifSource } from "shared/models/routes/organismes/cfa";

import logger from "@/common/logger";
import {
  effectifsDb,
  effectifsDECADb,
  missionLocaleEffectifsDb,
  organisationsDb,
  organismesDb,
} from "@/common/model/collections";
import { extractScoreInput, scoreEffectifs } from "@/common/services/classifier";

import { getOrganisationOrganismeByOrganismeId } from "../organisations.actions";
import { normalisePersonIdentifiant } from "../personV2/personV2.actions";

import { isDecaSnapshot, migrateMlRecordEffectifId } from "./mission-locale.actions";

/**
 * Détermine la collection source d'un effectif CFA. L'ERP est interrogé en premier (priorité
 * ERP > DECA) et DECA n'est consulté que si l'organisme y a accès.
 */
export async function resolveCfaEffectifSource(
  organismeId: ObjectId,
  effectifId: ObjectId
): Promise<CfaEffectifSource> {
  const erpEffectif = await effectifsDb().findOne(
    { _id: effectifId, organisme_id: organismeId },
    { projection: { _id: 1 } }
  );
  if (erpEffectif) {
    return "effectifs";
  }

  const organisme = await organismesDb().findOne({ _id: organismeId }, { projection: { is_allowed_deca: 1 } });
  if (organisme?.is_allowed_deca) {
    const decaEffectif = await effectifsDECADb().findOne(
      { _id: effectifId, organisme_id: organismeId },
      { projection: { _id: 1 } }
    );
    if (decaEffectif) {
      return "effectifsDECA";
    }
  }

  throw Boom.notFound("Effectif non trouvé");
}

export interface IEnsureMissionLocaleEffectifRecordResult {
  recordId: ObjectId | null;
  created: boolean;
}

function applyDottedSet(target: Record<string, any>, set: Record<string, unknown>) {
  for (const [path, value] of Object.entries(set)) {
    const keys = path.split(".");
    let cursor = target;
    for (const key of keys.slice(0, -1)) {
      if (typeof cursor[key] !== "object" || cursor[key] === null) {
        cursor[key] = {};
      }
      cursor = cursor[key];
    }
    cursor[keys[keys.length - 1]] = value;
  }
}

/**
 * Récupère — ou crée — le `missionLocaleEffectif` d'un effectif CFA, puis y applique `extraSet`.
 *
 * L'ordre des cinq chemins est un invariant : record direct, record par identifiant normalisé,
 * orphelin sur un autre CFA de la même ML, orphelin sur une autre ML, insertion (repli E11000).
 * La priorité ERP > DECA interdit tout repointage qui dégraderait un snapshot ERP en DECA.
 */
export async function ensureMissionLocaleEffectifRecord(
  organismeId: ObjectId,
  effectifId: string,
  source: CfaEffectifSource,
  extraSet: Record<string, unknown>,
  opts?: { dateRupture?: Date | null }
): Promise<IEnsureMissionLocaleEffectifRecordResult> {
  const db = source === "effectifsDECA" ? effectifsDECADb() : effectifsDb();
  const effectif = await db.findOne({
    _id: new ObjectId(effectifId),
    organisme_id: organismeId,
  });

  if (!effectif) {
    throw Boom.notFound("Effectif non trouvé");
  }

  const now = new Date();
  const newEffectifId = new ObjectId(effectifId);
  const incomingIsDeca = source === "effectifsDECA";

  const currentStatus =
    effectif._computed?.statut?.parcours?.filter((s) => s.date <= now).slice(-1)[0] ||
    effectif._computed?.statut?.parcours?.slice(-1)[0];

  const normalizedIdentifiant =
    effectif.apprenant.nom && effectif.apprenant.prenom && effectif.apprenant.date_de_naissance
      ? normalisePersonIdentifiant({
          nom: effectif.apprenant.nom,
          prenom: effectif.apprenant.prenom,
          date_de_naissance: effectif.apprenant.date_de_naissance,
        })
      : undefined;

  let existing = await missionLocaleEffectifsDb().findOne({
    effectif_id: newEffectifId,
    "effectif_snapshot.organisme_id": organismeId,
    soft_deleted: { $ne: true },
  });

  if (!existing && normalizedIdentifiant) {
    existing = await missionLocaleEffectifsDb().findOne({
      "identifiant_normalise.nom": normalizedIdentifiant.nom,
      "identifiant_normalise.prenom": normalizedIdentifiant.prenom,
      "identifiant_normalise.date_de_naissance": normalizedIdentifiant.date_de_naissance,
      "effectif_snapshot.organisme_id": organismeId,
      soft_deleted: { $ne: true },
    });
  }

  if (existing) {
    const isMigration = !existing.effectif_id.equals(newEffectifId);
    const existingIsDeca = isDecaSnapshot(existing.effectif_snapshot);

    let keeperId = existing._id;
    // Repointer effectif_id sur mismatch sinon le toggle reste OFF (lookup par effectif_id).
    // Skip si dégradation ERP→DECA — priorité ERP > DECA.
    if (isMigration && !(incomingIsDeca && !existingIsDeca)) {
      const result = await migrateMlRecordEffectifId(existing._id, existing.effectif_id, effectif, {
        extraSet,
      });
      keeperId = result.keeperId;
    } else {
      if (isMigration) {
        logger.warn(
          {
            ml_record: existing._id,
            existing_effectif: existing.effectif_id,
            existing_source: existing.effectif_snapshot?.source,
            incoming_effectif: newEffectifId,
            incoming_source: source,
          },
          "ensureMissionLocaleEffectifRecord: dégradation ERP→DECA bloquée, patch en place sans repointer effectif_id"
        );
      }
      await missionLocaleEffectifsDb().updateOne({ _id: existing._id }, { $set: extraSet });
    }
    scoreEffectifInBackground(keeperId, effectif);
    return { recordId: keeperId, created: false };
  }

  const mlOrganisation = await resolveMissionLocaleOrganisationForEffectif(effectif);

  // Record orphelin sur la même ML mais rattaché à un autre CFA (ex. deux établissements
  // d'une même CMA). Sans migration proactive, l'INSERT échouerait en E11000 et le
  // fallback patcherait le squatter sans repointer effectif_id.
  if (normalizedIdentifiant) {
    const crossOrganismeOrphan = await missionLocaleEffectifsDb().findOne({
      "identifiant_normalise.nom": normalizedIdentifiant.nom,
      "identifiant_normalise.prenom": normalizedIdentifiant.prenom,
      "identifiant_normalise.date_de_naissance": normalizedIdentifiant.date_de_naissance,
      mission_locale_id: mlOrganisation._id,
      soft_deleted: { $ne: true },
    });

    if (crossOrganismeOrphan) {
      const orphanIsDeca = isDecaSnapshot(crossOrganismeOrphan.effectif_snapshot);

      // Skip si dégradation ERP→DECA — priorité ERP > DECA. Patch en place.
      if (incomingIsDeca && !orphanIsDeca) {
        logger.warn(
          {
            ml_record: crossOrganismeOrphan._id,
            existing_effectif: crossOrganismeOrphan.effectif_id,
            existing_organisme: crossOrganismeOrphan.effectif_snapshot?.organisme_id,
            incoming_effectif: newEffectifId,
            incoming_organisme: organismeId,
            incoming_source: source,
          },
          "ensureMissionLocaleEffectifRecord: cross-organisme migration ERP→DECA bloquée, patch en place"
        );
        await missionLocaleEffectifsDb().updateOne({ _id: crossOrganismeOrphan._id }, { $set: extraSet });
        scoreEffectifInBackground(crossOrganismeOrphan._id, effectif);
        return { recordId: crossOrganismeOrphan._id, created: false };
      }

      const result = await migrateMlRecordEffectifId(
        crossOrganismeOrphan._id,
        crossOrganismeOrphan.effectif_id,
        effectif,
        { extraSet }
      );
      scoreEffectifInBackground(result.keeperId, effectif);
      return { recordId: result.keeperId, created: false };
    }
  }

  // Cross-ML : l'index unique global sur identifiant_normalise bloque l'INSERT. On repointe
  // effectif_id + snapshot, mais on PRÉSERVE mission_locale_id et les fields ML utilisateur
  // (situation, commentaires, ...) — la ML d'origine continue son suivi (policy produit).
  // skipCurrentStatus évite d'écraser current_status avec celui calculé depuis le nouvel effectif.
  if (normalizedIdentifiant) {
    const crossMlOrphan = await missionLocaleEffectifsDb().findOne({
      "identifiant_normalise.nom": normalizedIdentifiant.nom,
      "identifiant_normalise.prenom": normalizedIdentifiant.prenom,
      "identifiant_normalise.date_de_naissance": normalizedIdentifiant.date_de_naissance,
      soft_deleted: { $ne: true },
    });

    if (crossMlOrphan) {
      const orphanIsDeca = isDecaSnapshot(crossMlOrphan.effectif_snapshot);

      // Priorité ERP > DECA : patch en place sans repointer, snapshot ERP préservé.
      if (incomingIsDeca && !orphanIsDeca) {
        logger.warn(
          {
            ml_record: crossMlOrphan._id,
            existing_effectif: crossMlOrphan.effectif_id,
            existing_ml: crossMlOrphan.mission_locale_id,
            incoming_effectif: newEffectifId,
            incoming_organisme: organismeId,
            incoming_source: source,
          },
          "ensureMissionLocaleEffectifRecord: cross-ML migration ERP→DECA bloquée, patch en place"
        );
        await missionLocaleEffectifsDb().updateOne({ _id: crossMlOrphan._id }, { $set: extraSet });
        scoreEffectifInBackground(crossMlOrphan._id, effectif);
        return { recordId: crossMlOrphan._id, created: false };
      }

      const result = await migrateMlRecordEffectifId(crossMlOrphan._id, crossMlOrphan.effectif_id, effectif, {
        extraSet,
        skipCurrentStatus: true,
      });
      scoreEffectifInBackground(result.keeperId, effectif);
      return { recordId: result.keeperId, created: false };
    }
  }

  // L'index unique (mission_locale_id, effectif_id) n'est pas filtré sur soft_deleted : un dossier
  // soft-deleted par l'hydratation ferait échouer l'INSERT en E11000. On le ressuscite.
  const softDeletedRecord = await missionLocaleEffectifsDb().findOne({
    mission_locale_id: mlOrganisation._id,
    effectif_id: newEffectifId,
    soft_deleted: true,
  });

  if (softDeletedRecord) {
    await missionLocaleEffectifsDb().updateOne(
      { _id: softDeletedRecord._id },
      {
        $set: {
          soft_deleted: false,
          effectif_snapshot: { ...effectif, _id: effectif._id },
          effectif_snapshot_date: now,
          current_status: { value: currentStatus?.valeur ?? null, date: currentStatus?.date ?? null },
          ...(opts?.dateRupture ? { date_rupture: opts.dateRupture } : {}),
          ...(normalizedIdentifiant ? { identifiant_normalise: normalizedIdentifiant } : {}),
          ...extraSet,
        },
      }
    );
    scoreEffectifInBackground(softDeletedRecord._id, effectif);
    return { recordId: softDeletedRecord._id, created: false };
  }

  const organisation = await getOrganisationOrganismeByOrganismeId(organismeId);
  const organisme = await organismesDb().findOne({ _id: organismeId }, { projection: { is_allowed_collab: 1 } });

  const document: Record<string, any> = {
    mission_locale_id: mlOrganisation._id,
    effectif_id: newEffectifId,
    effectif_snapshot: { ...effectif, _id: effectif._id },
    effectif_snapshot_date: now,
    date_rupture: opts?.dateRupture ?? null,
    created_at: now,
    current_status: {
      value: currentStatus?.valeur ?? null,
      date: currentStatus?.date ?? null,
    },
    computed: {
      organisme: {
        ml_beta_activated_at: organisation?.ml_beta_activated_at ?? null,
        is_allowed_collab: organisme?.is_allowed_collab ?? false,
      },
      ...(mlOrganisation.activated_at ? { mission_locale: { activated_at: mlOrganisation.activated_at } } : {}),
    },
    organisme_data: {
      has_unread_notification: false,
    },
    ...(normalizedIdentifiant ? { identifiant_normalise: normalizedIdentifiant } : {}),
  };
  applyDottedSet(document, extraSet);

  try {
    const { insertedId } = await missionLocaleEffectifsDb().insertOne(document as any);
    scoreEffectifInBackground(insertedId, effectif);
    return { recordId: insertedId, created: true };
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      const filter = normalizedIdentifiant
        ? {
            "identifiant_normalise.nom": normalizedIdentifiant.nom,
            "identifiant_normalise.prenom": normalizedIdentifiant.prenom,
            "identifiant_normalise.date_de_naissance": normalizedIdentifiant.date_de_naissance,
            mission_locale_id: mlOrganisation._id,
            soft_deleted: { $ne: true },
          }
        : {
            effectif_id: newEffectifId,
            mission_locale_id: mlOrganisation._id,
            soft_deleted: { $ne: true },
          };

      const updated = await missionLocaleEffectifsDb().findOneAndUpdate(
        filter,
        { $set: extraSet },
        { returnDocument: "after", projection: { _id: 1 }, includeResultMetadata: false }
      );
      if (updated?._id) {
        scoreEffectifInBackground(updated._id, effectif);
      }
      return { recordId: updated?._id ?? null, created: false };
    }
    throw error;
  }
}

async function resolveMissionLocaleOrganisationForEffectif(
  effectif: IEffectif | IEffectifDECA
): Promise<IOrganisationMissionLocale> {
  const mlNumericId = effectif.apprenant.adresse?.mission_locale_id;
  if (!mlNumericId) {
    throw Boom.badData("Impossible de déclarer en rupture : zone Mission Locale non identifiée pour cet effectif");
  }

  const mlOrganisation = (await organisationsDb().findOne({
    type: "MISSION_LOCALE",
    ml_id: mlNumericId,
  })) as IOrganisationMissionLocale | null;

  if (!mlOrganisation) {
    throw Boom.badData("Impossible de déclarer en rupture : organisation Mission Locale non trouvée");
  }

  return mlOrganisation;
}

export function scoreEffectifInBackground(missionLocaleEffectifId: ObjectId, effectif: IEffectif | IEffectifDECA) {
  const scoreInput = extractScoreInput(effectif);
  if (!scoreInput) return;

  scoreEffectifs([scoreInput])
    .then((result) => {
      const score = result.scores?.[0];
      if (score != null) {
        return missionLocaleEffectifsDb().updateOne(
          { _id: missionLocaleEffectifId },
          {
            $set: {
              classification_reponse_appel: {
                score,
                model: result.model,
                scored_at: new Date(),
              },
            },
          }
        );
      }
    })
    .catch((err) => {
      logger.warn({ err, effectif_id: effectif._id }, "Classifier scoring failed, continuing without score");
    });
}
