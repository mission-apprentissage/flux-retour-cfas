import logger from "@/common/logger";
import { effectifsQueueDb } from "@/common/model/collections";
import { reportDependencyHealth } from "@/common/services/sentry/reportOnce";

/**
 * « Plus rien n'est ingéré » est une **absence** de signal : aucune règle
 * d'erreur ne peut la détecter, puisque rien n'échoue. Ce cron la convertit en
 * événement.
 *
 * Le critère est l'âge du plus vieux document en attente, pas « rien traité
 * depuis N minutes » : sans trafic la nuit, ce dernier alerterait à tort. S'il
 * n'y a rien en attente, il n'y a rien à signaler.
 */
const STALE_AFTER_MINUTES = 30;

export async function heartbeatIngestion(): Promise<number> {
  const [oldest] = await effectifsQueueDb()
    .find({ processed_at: { $exists: false } }, { projection: { created_at: 1 } })
    .sort({ created_at: 1 })
    .limit(1)
    .toArray();

  const waitingSince = oldest?.created_at ?? null;
  const waitingMinutes = waitingSince ? Math.round((Date.now() - waitingSince.getTime()) / 60_000) : 0;
  const healthy = waitingMinutes < STALE_AFTER_MINUTES;

  if (!healthy) {
    logger.error({ waitingMinutes, waitingSince }, "[heartbeat] l'ingestion n'avance plus");
  }

  reportDependencyHealth(
    "ingestion",
    healthy,
    new Error(`Aucun effectif ingéré depuis ${waitingMinutes} minutes`),
    // Les ERP transmettent dans le vide tant que la file n'avance pas.
    { tier: "oncall", errorKind: "bug" }
  );

  return healthy ? 0 : 1;
}
