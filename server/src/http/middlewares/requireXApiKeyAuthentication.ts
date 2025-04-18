import Boom from "boom";
import { NextFunction, Response } from "express";

export default function requireXApiKeyAuthentication({ apiKeyValue }) {
  return async (req: any, _res: Response, next: NextFunction) => {
    try {
      const xApiKey = req.headers["x-api-key"];
      if (!xApiKey) {
        throw Boom.unauthorized("Missing x-api-key header");
      }

      if (xApiKey !== apiKeyValue) {
        throw Boom.unauthorized("Invalid x-api-key");
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
