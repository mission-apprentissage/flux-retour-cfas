import { captureException } from "@sentry/node";
import Boom from "boom";

import config from "@/config";

function shouldLogError(boomError: Boom, req: Request): boolean {
  if (boomError.isServer) {
    return true;
  }

  // We want to track client errors from ERP and other API actors
  return req.url.startsWith("/api/v3/dossiers-apprenants");
}

export default () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (rawError, req, res, next) => {
    req.err = rawError;

    let boomError;

    if (rawError.isBoom) {
      boomError = rawError;
    } else if (rawError.issues) {
      //This is a Zod validation error
      boomError = Boom.badRequest("Erreur de validation");
      boomError.output.payload.issues = rawError.issues;
      boomError.output.payload.details = rawError.issues[0].message; // compatibility with other error handling
    } else if (rawError?.[0]?.errors?.name === "ZodError") {
      //This is a Zod validation error
      boomError = Boom.badRequest("Erreur de validation");
      boomError.output.payload.details = rawError?.[0].errors.issues;
    } else if (rawError.name === "ValidationError") {
      //This is a joi validation error
      boomError = Boom.badRequest("Erreur de validation");
      boomError.output.payload.details = rawError.details;
    } else {
      boomError = Boom.boomify(rawError, {
        statusCode: rawError.status || 500,
        ...(!rawError.message ? { message: "Une erreur est survenue" } : {}),
      });
      if (config.env === "local") {
        boomError.output.payload.details = {
          rawError: {
            message: rawError.message,
          },
        };
      }
    }

    if (shouldLogError(boomError, req)) {
      captureException(rawError);
    }

    const { error, message, details, issues } = boomError.output.payload;
    return res.status(boomError.output.statusCode).send({
      error,
      message,
      details,
      issues,
    });
  };
};
