import { subDays } from "date-fns";
import type { ObjectId } from "mongodb";
import {
  CFA_COLLAB_INACTIVITE_RELANCE_DAYS,
  CFA_COLLAB_INACTIVITE_SUSPENSION_DAYS,
} from "shared/constants/collaboration";
import type { IOrganisationOrganismeFormation } from "shared/models/data/organisations.model";

import { getBrevoSyncSettings } from "@/common/actions/brevo/contacts/sync-settings.actions";
import { enqueueBrevoEvent } from "@/common/actions/brevo/events/enqueue-event";
import parentLogger from "@/common/logger";
import {
  auditLogsDb,
  missionLocaleEffectifsDb,
  organisationsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";

const logger = parentLogger.child({ module: "job:collab:inactivite-cfa" });

export interface CollabInactiviteCfaOptions {
  dryRun?: boolean;
  limit?: number;
}

export interface CollabInactiviteCfaResult {
  dryRun: boolean;
  eventsEnabled: boolean;
  examined: number;
  skippedNoActivityDate: number;
  relances: number;
  relancesSansDestinataire: number;
  relancesSkippedEventsDisabled: number;
  suspensions: number;
}

const maxDate = (dates: Array<Date | null | undefined>): Date | null => {
  let max: Date | null = null;
  for (const d of dates) {
    if (d && (!max || d > max)) max = d;
  }
  return max;
};

// Relance à 30 j sans connexion, suspension 5 j après la relance. La relance est gatée par le
// toggle Brevo `eventsEnabled` lu sans test d'env : hors prod l'événement est no-op mais le flux est recettable.
export async function collabInactiviteCfaJob({
  dryRun = false,
  limit,
}: CollabInactiviteCfaOptions = {}): Promise<CollabInactiviteCfaResult> {
  const now = new Date();
  const { eventsEnabled } = await getBrevoSyncSettings();
  const relanceCutoff = subDays(now, CFA_COLLAB_INACTIVITE_RELANCE_DAYS);
  const suspensionCutoff = subDays(now, CFA_COLLAB_INACTIVITE_SUSPENSION_DAYS);

  logger.info({ dryRun, limit, eventsEnabled }, "Début du job collab:inactivite-cfa");

  const result: CollabInactiviteCfaResult = {
    dryRun,
    eventsEnabled,
    examined: 0,
    skippedNoActivityDate: 0,
    relances: 0,
    relancesSansDestinataire: 0,
    relancesSkippedEventsDisabled: 0,
    suspensions: 0,
  };

  const cursor = organismesDb().find(
    { is_allowed_collab: true, collab_suspended_at: null },
    { projection: { _id: 1, collab_inactivity_email_sent_at: 1 }, ...(limit ? { limit } : {}) }
  );

  for await (const organisme of cursor) {
    result.examined++;
    const organismeId = organisme._id as ObjectId;

    const organisations = (await organisationsDb()
      .find(
        { type: "ORGANISME_FORMATION", organisme_id: organismeId.toString() },
        { projection: { _id: 1, ml_beta_activated_at: 1 } }
      )
      .toArray()) as Array<Pick<IOrganisationOrganismeFormation, "_id" | "ml_beta_activated_at">>;

    const users = organisations.length
      ? await usersMigrationDb()
          .find(
            { organisation_id: { $in: organisations.map((o) => o._id) }, account_status: "CONFIRMED" },
            { projection: { _id: 1, last_connection: 1, unsubscribe: 1 } }
          )
          .toArray()
      : [];

    const lastActivity = maxDate([
      ...organisations.map((o) => o.ml_beta_activated_at),
      ...users.map((u) => u.last_connection),
    ]);
    if (!lastActivity) {
      logger.warn({ organismeId }, "collab inactivité : ni date d'activation ML ni connexion, organisme sauté");
      result.skippedNoActivityDate++;
      continue;
    }

    const emailSentAt = organisme.collab_inactivity_email_sent_at;

    if (emailSentAt && lastActivity < emailSentAt) {
      if (emailSentAt > suspensionCutoff) continue;

      if (dryRun) {
        result.suspensions++;
        continue;
      }
      const { modifiedCount } = await organismesDb().updateOne(
        { _id: organismeId, collab_suspended_at: null, collab_inactivity_email_sent_at: { $lte: suspensionCutoff } },
        { $set: { collab_suspended_at: now } }
      );
      if (modifiedCount === 0) continue;

      await missionLocaleEffectifsDb().updateMany(
        { "effectif_snapshot.organisme_id": organismeId },
        { $set: { "computed.organisme.collab_suspended_at": now } }
      );
      await auditLogsDb().insertOne({
        action: "collab_suspended_inactivity",
        date: now,
        data: { organisme_id: organismeId, last_activity: lastActivity, email_sent_at: emailSentAt },
      });
      logger.info({ organismeId, lastActivity, emailSentAt }, "collab suspendue pour inactivité");
      result.suspensions++;
      continue;
    }

    if (lastActivity >= relanceCutoff) continue;

    if (!eventsEnabled) {
      result.relancesSkippedEventsDisabled++;
      continue;
    }
    if (dryRun) {
      result.relances++;
      continue;
    }

    const { modifiedCount } = await organismesDb().updateOne(
      {
        _id: organismeId,
        collab_suspended_at: null,
        $or: [{ collab_inactivity_email_sent_at: null }, { collab_inactivity_email_sent_at: { $lt: lastActivity } }],
      },
      { $set: { collab_inactivity_email_sent_at: now } }
    );
    if (modifiedCount === 0) continue;

    const recipients = users.filter((u) => u.unsubscribe !== true);
    if (recipients.length === 0) {
      logger.warn({ organismeId, lastActivity }, "collab inactivité : relance sans destinataire, verrou posé");
      result.relancesSansDestinataire++;
    }
    for (const user of recipients) {
      await enqueueBrevoEvent("collab-inactivite", { userId: user._id.toString() });
    }
    logger.info({ organismeId, lastActivity, recipients: recipients.length }, "collab inactivité : relance envoyée");
    result.relances++;
  }

  logger.info(result, "Fin du job collab:inactivite-cfa");
  return result;
}
