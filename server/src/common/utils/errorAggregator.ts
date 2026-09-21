import { captureException, withScope } from "@sentry/node";

import { getErrorMessage } from "./errorUtils";

type CauseBucket = { key: string; count: number; sample: Error };

/** N'écrit aucun log : les appelants journalisent avec leur propre contexte. */
export type ErrorAggregator = {
  ok(count?: number): void;
  record(error: unknown): void;
  /** Émet la synthèse du lot courant puis remet les compteurs à zéro. N'échoue jamais. */
  flush(): void;
  /** Émet la synthèse finale, et lève si le taux d'échec dépasse le seuil. */
  finish(): void;
  readonly failed: number;
  readonly processed: number;
};

export type ErrorAggregatorOptions = {
  /** Au-delà de ce taux d'échec, finish() lève sans capturer : job-processor s'en charge. */
  failureRateThreshold?: number;
  maxDistinctCauses?: number;
};

/** Neutralise les valeurs variables, sinon chaque identifiant fabriquerait sa propre cause. */
export function normalizeCauseKey(message: string): string {
  return message
    .replace(/[0-9a-f]{24}\b/gi, "<id>")
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "<uuid>")
    .replace(/\d{4}-\d{2}-\d{2}(?:T[\d:.]+Z?)?/g, "<date>")
    .replace(/\d+/g, "<n>")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

export function createErrorAggregator(name: string, options: ErrorAggregatorOptions = {}): ErrorAggregator {
  const { failureRateThreshold = 1, maxDistinctCauses = 5 } = options;

  let failed = 0;
  let processed = 0;
  let causes = new Map<string, CauseBucket>();

  const toError = (error: unknown): Error =>
    error instanceof Error ? error : new Error(getErrorMessage(error) || "Erreur inconnue");

  const emit = (): void => {
    if (failed === 0) return;

    const distinct = [...causes.values()].sort((a, b) => b.count - a.count);
    const top = distinct.slice(0, maxDistinctCauses);

    withScope((scope) => {
      scope.setTag("job", name);
      // Fixe : sinon « 12/1000 » et « 37/1000 » créeraient deux issues.
      scope.setFingerprint(["job-error-summary", name]);
      scope.setContext("échecs", {
        processed,
        failed,
        failureRate: processed > 0 ? failed / processed : 1,
        distinctCauses: distinct.length,
        topCauses: top.map(({ key, count }) => ({ key, count })),
      });
      captureException(new Error(`[${name}] échecs agrégés`, { cause: top[0]?.sample }));
    });
  };

  const reset = (): void => {
    failed = 0;
    processed = 0;
    causes = new Map();
  };

  return {
    get failed() {
      return failed;
    },
    get processed() {
      return processed;
    },

    ok(count = 1) {
      processed += count;
    },

    record(error) {
      const err = toError(error);
      processed += 1;
      failed += 1;

      const key = normalizeCauseKey(`${err.name}: ${err.message}`);
      const bucket = causes.get(key);
      if (bucket) {
        bucket.count += 1;
      } else {
        causes.set(key, { key, count: 1, sample: err });
      }
    },

    flush() {
      emit();
      reset();
    },

    finish() {
      const rate = processed > 0 ? failed / processed : 0;
      if (failed > 0 && rate >= failureRateThreshold) {
        const worst = [...causes.values()].sort((a, b) => b.count - a.count)[0];
        reset();
        throw new Error(`[${name}] ${rate === 1 ? "tous les éléments ont échoué" : "taux d'échec trop élevé"}`, {
          cause: worst?.sample,
        });
      }
      emit();
      reset();
    },
  };
}
