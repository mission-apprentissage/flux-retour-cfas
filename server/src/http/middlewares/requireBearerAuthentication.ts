import Boom from "boom";
import { NextFunction, Response } from "express";

// Bearer API_KEY

// TODO FIXME req: any instead of Request overload
export default function requireBearerAuthentication() {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      let token: string | undefined = req.headers.authorization;
      if (!token) {
        throw Boom.forbidden("Clé API manquante");
      }

      if (token.startsWith("Bearer ")) {
        token = token.substring(7, token.length);
      } else {
        throw Boom.forbidden("La clé API doit etre au format Bearer");
      }

      res.locals.token = token;

      next();
    } catch (err) {
      next(err);
    }
  };
}
