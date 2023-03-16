/**
 * Forked from https://github.com/Aquila169/zod-express-middleware/blob/c434943b385eca214533f6c38caf83d513477dc8/src/index.ts#L50
 * so we can control the error handling
 *
 * @param {*} schemas
 * @returns
 */
export default function validateRequestMiddleware(schemas) {
  return (req, res, next) => {
    const errors = [];
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
      return next(errors, req, res);
    }
    return next();
  };
}
