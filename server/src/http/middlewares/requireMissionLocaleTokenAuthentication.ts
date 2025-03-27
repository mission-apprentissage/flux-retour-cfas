import { NextFunction, Response } from "express";

export default function requireMissionLocaleTokenAuthentication() {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      next();
    } catch (err) {
      next(err);
    }
  };
}
