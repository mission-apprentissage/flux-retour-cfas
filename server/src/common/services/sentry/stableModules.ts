import type { SentryEventLike } from "shared/observability/sentryPolicy";

const CHUNK_HASH = /^chunk-[A-Z0-9]{8}$/;

/**
 * Sentry regroupe sur le `module` des frames, et tsup nomme ses chunks avec un
 * hash qui change à chaque build : sans cela, une même erreur ouvre une nouvelle
 * issue à chaque déploiement.
 */
export function stabilizeChunkModules<T extends SentryEventLike>(event: T): T {
  for (const value of event.exception?.values ?? []) {
    for (const frame of value.stacktrace?.frames ?? []) {
      if (frame.module && CHUNK_HASH.test(frame.module)) {
        frame.module = "chunk";
      }
    }
  }
  return event;
}
