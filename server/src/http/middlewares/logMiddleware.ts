import { NextFunction, Request, Response } from "express";

import logger from "@/common/logger";

export function logMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = new Date().getTime();

  const onResponseFinished = () => {
    try {
      const error = req.err;
      const statusCode = res.statusCode;
      const logInfos = {
        type: "http",
        responseTime: new Date().getTime() - startTime,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        requestId: (req as any).requestId,
        user: req.user?._id,
        // via error serializer
        // err: error,
        // detailed error
        error: error && {
          ...error,
          message: error.message,
          stack: error.stack,
        },
      };

      if (error || (statusCode >= 400 && statusCode < 600)) {
        logger.error(logInfos, "request errored");
      } else {
        logger.info(logInfos, "request completed");
      }
    } finally {
      res.removeListener("finish", onResponseFinished);
      res.removeListener("close", onResponseFinished);
    }
  };

  res.on("close", onResponseFinished);
  res.on("finish", onResponseFinished);

  next();
}
