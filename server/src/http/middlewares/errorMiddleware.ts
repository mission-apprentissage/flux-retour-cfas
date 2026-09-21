import { captureException, withScope } from "@sentry/node";
import Boom from "boom";
import { ErrorRequestHandler, Request } from "express";
import { ZodError } from "zod";

import { toValidationError } from "@/common/utils/validationUtils";
import config from "@/config";

interface ErrorPayload extends Boom.Payload {
  details?: unknown;
  issues?: unknown;
}

/**
 * Table de préfixes plutôt que l'URL : un tag doit rester de cardinalité bornée,
 * or les URL portent des identifiants. Le préfixe le plus spécifique gagne.
 */
const ROUTE_GROUPS: ReadonlyArray<readonly [string, string]> = [
  ["/api/v3/dossiers-apprenants", "ingestion-v3"],
  ["/api/webhooks", "webhook"],
  ["/api/healthcheck", "healthcheck"],
  ["/api/v1/admin", "admin"],
  ["/api/v1/auth", "auth"],
  ["/api/v2/auth", "auth"],
  ["/api/v1/password", "auth"],
  ["/api/v1/session", "auth"],
  ["/api/v1/mission-locale", "mission-locale"],
  ["/api/v1/affelnet", "affelnet"],
  ["/api/v2/affelnet", "affelnet"],
  ["/api/v1/onboarding", "onboarding"],
  ["/api/v1/organismes", "organismes"],
  ["/api/organismes", "organismes"],
];

export function routeGroupOf(req: Request): string {
  const url = req.originalUrl;
  let match = "other";
  let matchedLength = 0;

  for (const [prefix, group] of ROUTE_GROUPS) {
    if (url.startsWith(prefix) && prefix.length > matchedLength) {
      match = group;
      matchedLength = prefix.length;
    }
  }

  return match;
}

export function errorKindOf(boomError: Boom): string {
  const status = boomError.output.statusCode;
  if (status === 401 || status === 403) return "auth";
  if (status === 429) return "rate-limit";
  if (status >= 400 && status < 500) return "validation";
  return "bug";
}

function toError(rawError: unknown): Error {
  if (rawError instanceof Error) {
    return rawError;
  }
  return new Error(typeof rawError === "string" ? rawError : "Une erreur est survenue");
}

export function normalizeToBoom(rawError: unknown): Boom {
  const error = toError(rawError);
  const payloadOf = (boom: Boom): ErrorPayload => boom.output.payload;

  if (Boom.isBoom(error)) {
    return error;
  }

  if (error instanceof ZodError) {
    return toValidationError(error);
  }

  if (error.name === "ValidationError") {
    const boomError = Boom.badRequest("Erreur de validation");
    payloadOf(boomError).details = "details" in error ? error.details : undefined;
    return boomError;
  }

  const status = "status" in error && typeof error.status === "number" ? error.status : 500;
  const boomError = Boom.boomify(error, {
    statusCode: status,
    ...(!error.message ? { message: "Une erreur est survenue" } : {}),
  });
  if (config.env === "local") {
    payloadOf(boomError).details = { rawError: { message: error.message } };
  }
  return boomError;
}

/**
 * Seule règle de capture du serveur HTTP. Les 4xx de /api/v3/dossiers-apprenants étaient
 * capturées en plus des 5xx ; ce suivi est déjà assuré par effectifsQueue.validation_errors
 * et les pages « transmissions » de l'UI, où chaque organisme consulte ses propres erreurs.
 */
export function shouldReportError(boomError: Boom): boolean {
  return boomError.isServer;
}

export default (): ErrorRequestHandler => {
  return (rawError: unknown, req, res, _next) => {
    req.err = toError(rawError);

    const boomError = normalizeToBoom(rawError);
    const { statusCode } = boomError.output;

    if (shouldReportError(boomError)) {
      withScope((scope) => {
        scope.setTag("route_group", routeGroupOf(req));
        scope.setTag("http_status_class", statusCode >= 500 ? "5xx" : "4xx");
        scope.setTag("error_kind", errorKindOf(boomError));
        scope.setTag("http.method", req.method);
        captureException(rawError, { mechanism: { type: "middleware", handled: false } });
      });
    }

    const { error: errorName, message, details, issues } = boomError.output.payload as ErrorPayload;
    return res.status(statusCode).send({
      error: errorName,
      message,
      details,
      issues,
    });
  };
};
