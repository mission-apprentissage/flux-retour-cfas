import { ExtraErrorData } from "@sentry/integrations";
import * as Sentry from "@sentry/node";
import type { Integration } from "@sentry/types";
import type { Express } from "express";
import { buildBeforeSend, type SentryEventLike } from "shared/observability/sentryPolicy";

import config from "../../../config";

import { applyAlertContract } from "./alertContract";
import { dropJobProcessorNoise } from "./jobProcessorNoise";

/** Les quatre façons de démarrer le code serveur, distinguées par le tag `app_runtime`. */
export type ServerRuntime = "api" | "job-processor" | "queue-processor" | "cli";

/**
 * L'init a lieu avant que commander n'ait analysé la ligne de commande : on lit
 * donc argv directement, pour que même une erreur de démarrage porte son runtime.
 */
export function detectRuntime(argv: readonly string[] = process.argv): ServerRuntime {
  const command = argv.slice(2).find((arg) => !arg.startsWith("-"));

  switch (command) {
    case "job_processor:start":
      return "job-processor";
    case "queue_processor:start":
      return "queue-processor";
    case "start":
      return "api";
    default:
      return "cli";
  }
}

/**
 * Aucune catégorie de rejet n'est active côté serveur : elles décrivent du bruit
 * de navigateur, et « Failed to fetch » y désigne au contraire une panne d'API
 * amont. Seul `dropJobProcessorNoise` filtre, en amont de la politique.
 */
const applyPolicy = buildBeforeSend<SentryEventLike>({ enrich: applyAlertContract });

function getSentryOptions(runtime: ServerRuntime, extraIntegrations: Integration[]): Sentry.NodeOptions {
  return {
    tracesSampler: (samplingContext) => {
      if (samplingContext.transactionContext?.op === "queue.item") {
        // We want to sample the process effectif transaction at a rate of 1/1_000
        return 1 / 1_000;
      }

      if (samplingContext.transactionContext?.op === "deca.item") {
        // We want to sample the process effectif transaction at a rate of 1/1_000
        return 1 / 1_000;
      }

      // Continue trace decision, if there is any parentSampled information
      if (samplingContext.parentSampled != null) {
        return samplingContext.parentSampled;
      }

      if (samplingContext.transactionContext?.op === "processor.job") {
        // Sample 100% of processor jobs
        return 1.0;
      }

      return 0.01;
    },
    beforeSend: (event) => {
      const kept = dropJobProcessorNoise(event);
      return kept ? (applyPolicy(kept) as Sentry.Event | null) : null;
    },
    initialScope: { tags: { app_runtime: runtime } },
    tracePropagationTargets: [/^https:\/\/[^/]*\.apprentissage\.beta\.gouv\.fr/],
    environment: config.env,
    release: config.version,
    enabled: config.env !== "local" && config.env !== "test",
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Mongo({ useMongoose: false }),
      new ExtraErrorData({ depth: 16 }) as Integration,
      ...extraIntegrations,
    ],
  };
}

export function initSentryProcessor(): void {
  Sentry.init(getSentryOptions(detectRuntime(), []));
}

export async function closeSentry(): Promise<void> {
  await Sentry.close(2_000);
}

export function initSentryExpress(app: Express): void {
  Sentry.init(
    getSentryOptions("api", [
      new Sentry.Integrations.Express({ app }),
      // Serveur HTTP seulement : les traitements par lots des processors bloquent
      // légitimement la boucle d'événements.
      new Sentry.Integrations.Anr({ captureStackTrace: true }) as Integration,
    ])
  );
}
