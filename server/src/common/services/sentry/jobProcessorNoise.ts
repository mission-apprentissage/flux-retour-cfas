import type { SentryEventLike } from "shared/observability/sentryPolicy";

const JOB_ABORTED = "[job-processor] Job aborted";

/** Nombre d'échecs successifs à partir duquel job-processor arrête le worker. */
const HEARTBEAT_TERMINAL_FAILURES = 3;

function messagesOf(event: SentryEventLike): string[] {
  const fromException = event.exception?.values?.map((v) => v.value ?? "") ?? [];
  return event.message ? [...fromException, event.message] : fromException;
}

/**
 * `initJobProcessor` n'expose aucune option Sentry : beforeSend est le seul levier
 * sans forker la lib.
 */
export function dropJobProcessorNoise<T extends SentryEventLike>(event: T): T | null {
  // Émis à chaque arrêt de process pour le job en cours. L'information reste durable en
  // base : job_processor.jobs en status "errored", output.error "Interrupted".
  if (messagesOf(event).some((m) => m.includes(JOB_ABORTED))) {
    return null;
  }

  // Capturé dans un setInterval de 30 s : une panne Mongo prolongée produirait un
  // événement toutes les 30 secondes. Seul l'échec terminal est actionnable.
  const successiveErrorsCount = event.extra?.successiveErrorsCount;
  if (typeof successiveErrorsCount === "number" && successiveErrorsCount < HEARTBEAT_TERMINAL_FAILURES) {
    return null;
  }

  return event;
}
