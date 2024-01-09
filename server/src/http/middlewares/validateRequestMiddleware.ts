import { NextFunction, RequestHandler } from "express";
import { ZodEffects, ZodError, ZodSchema } from "zod";

declare type RequestValidation<TParams, TQuery, TBody> = {
  params?: ZodSchema<TParams>;
  query?: ZodSchema<TQuery>;
  body?: ZodSchema<TBody>;
};

declare type RequestProcessing<TParams, TQuery, TBody> = {
  params?: ZodEffects<any, TParams>;
  query?: ZodEffects<any, TQuery>;
  body?: ZodEffects<any, TBody>;
};

type ErrorListItem = { type: "Query" | "Params" | "Body"; errors: ZodError<any> };

/**
 * Forked from https://github.com/Aquila169/zod-express-middleware/blob/c434943b385eca214533f6c38caf83d513477dc8/src/index.ts#L50
 * so we can control the error handling
 */
function validateRequestMiddleware<TParams = any, TQuery = any, TBody = any>(
  schemas: RequestProcessing<TParams, TQuery, TBody>
): RequestHandler<TParams, any, TBody, TQuery>;
function validateRequestMiddleware<TParams = any, TQuery = any, TBody = any>(
  schemas: RequestValidation<TParams, TQuery, TBody>
): RequestHandler<TParams, any, TBody, TQuery>;
function validateRequestMiddleware<TParams = any, TQuery = any, TBody = any>(
  schemas: RequestValidation<TParams, TQuery, TBody> | RequestProcessing<TParams, TQuery, TBody>
): RequestHandler<TParams, any, TBody, TQuery> {
  return (req, res, next: NextFunction) => {
    const errors: Array<ErrorListItem> = [];
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
        req.query = parsed.data;
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
      return (next as any)(errors, req, res);
    }
    return next();
  };
}

export default validateRequestMiddleware;
