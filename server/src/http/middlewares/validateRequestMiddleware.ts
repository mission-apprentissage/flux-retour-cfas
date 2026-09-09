import { RequestHandler } from "express";
import { ZodError, ZodType, ZodTypeDef } from "zod";

import { DefaultParams, DefaultQuery } from "@/http/middlewares/helpers";

type RequestValidation<TParams, TQuery, TBody> = {
  params?: ZodType<TParams, ZodTypeDef, unknown>;
  query?: ZodType<TQuery, ZodTypeDef, unknown>;
  body?: ZodType<TBody, ZodTypeDef, unknown>;
};

export type ValidationErrorItem = { type: "Query" | "Params" | "Body"; errors: ZodError };

export function isValidationErrorList(error: unknown): error is ValidationErrorItem[] {
  return Array.isArray(error) && error.length > 0 && error[0]?.errors instanceof ZodError;
}

/**
 * Forked from https://github.com/Aquila169/zod-express-middleware/blob/c434943b385eca214533f6c38caf83d513477dc8/src/index.ts#L50
 * so we can control the error handling
 */
function validateRequestMiddleware<TParams = DefaultParams, TQuery = DefaultQuery, TBody = unknown>(
  schemas: RequestValidation<TParams, TQuery, TBody>
): RequestHandler<TParams, unknown, TBody, TQuery> {
  return (req, _res, next) => {
    const errors: ValidationErrorItem[] = [];
    if (schemas.params) {
      const parsed = schemas.params.safeParse(req.params);
      if (parsed.success) {
        req.params = parsed.data;
      } else {
        errors.push({ type: "Params", errors: parsed.error });
      }
    }
    if (schemas.query) {
      const parsed = schemas.query.safeParse(req.query);
      if (parsed.success) {
        // Express 5 : req.query est un getter en lecture seule (le réassigner throw).
        // On redéfinit la propriété pour exposer la donnée validée/coercée aux handlers.
        Object.defineProperty(req, "query", { value: parsed.data, writable: true, configurable: true });
      } else {
        errors.push({ type: "Query", errors: parsed.error });
      }
    }
    if (schemas.body) {
      const parsed = schemas.body.safeParse(req.body);
      if (parsed.success) {
        req.body = parsed.data;
      } else {
        errors.push({ type: "Body", errors: parsed.error });
      }
    }
    if (errors.length > 0) {
      return next(errors);
    }
    return next();
  };
}

export default validateRequestMiddleware;
