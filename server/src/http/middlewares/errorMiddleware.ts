import { captureException } from "@sentry/node";
import Boom from "boom";
import { ErrorRequestHandler, Request } from "express";
import { ZodError } from "zod";

import config from "@/config";
import { isValidationErrorList } from "@/http/middlewares/validateRequestMiddleware";

interface ErrorPayload extends Boom.Payload {
  details?: unknown;
  issues?: unknown;
}

function shouldLogError(boomError: Boom, req: Request): boolean {
  if (boomError.isServer) {
    return true;
  }

  // We want to track client errors from ERP and other API actors
  return req.url.startsWith("/api/v3/dossiers-apprenants");
}

function toError(rawError: unknown): Error {
  if (rawError instanceof Error) {
    return rawError;
  }
  return new Error(typeof rawError === "string" ? rawError : "Une erreur est survenue");
}

export default (): ErrorRequestHandler => {
  return (rawError: unknown, req, res, _next) => {
    const error = toError(rawError);
    req.err = error;

    let boomError: Boom;
    const payload = (): ErrorPayload => boomError.output.payload;

    if (Boom.isBoom(error)) {
      boomError = error;
    } else if (error instanceof ZodError) {
      boomError = Boom.badRequest("Erreur de validation");
      payload().issues = error.issues;
      payload().details = error.issues[0]?.message; // compatibility with other error handling
    } else if (isValidationErrorList(rawError)) {
      boomError = Boom.badRequest("Erreur de validation");
      payload().details = rawError[0].errors.issues;
    } else if (error.name === "ValidationError") {
      boomError = Boom.badRequest("Erreur de validation");
      payload().details = "details" in error ? error.details : undefined;
    } else {
      const status = "status" in error && typeof error.status === "number" ? error.status : 500;
      boomError = Boom.boomify(error, {
        statusCode: status,
        ...(!error.message ? { message: "Une erreur est survenue" } : {}),
      });
      if (config.env === "local") {
        payload().details = {
          rawError: {
            message: error.message,
          },
        };
      }
    }

    if (shouldLogError(boomError, req)) {
      captureException(rawError);
    }

    const { error: errorName, message, details, issues } = payload();
    return res.status(boomError.output.statusCode).send({
      error: errorName,
      message,
      details,
      issues,
    });
  };
};
