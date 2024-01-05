import Boom from "boom";
import { NextFunction, Response } from "express";

// Bearer API_KEY

// TODO FIXME req: any instead of Request overload
export default function requireBearerAuthentication() {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      let token: string | undefined = req.headers.authorization;
      if (!token) {
        throw Boom.forbidden("Missing API key");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7, token.length);
      } else {
        throw Boom.forbidden("API key isn't valid");
      }

      res.locals.token = token;

      next();
    } catch (err) {
      next(err);
    }
  };
}
