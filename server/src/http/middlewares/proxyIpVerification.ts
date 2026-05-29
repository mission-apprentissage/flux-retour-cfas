import express from "express";

import logger from "@/common/logger";

let logged = false;

export function proxyIpVerification(): express.RequestHandler {
  return (req, _res, next) => {
    if (!logged && req.method !== "OPTIONS" && req.path !== "/api" && req.path !== "/api/healthcheck") {
      logged = true;
      logger.info(
        {
          reqIp: req.ip,
          xForwardedFor: req.header("x-forwarded-for"),
          xRealIp: req.header("x-real-ip"),
        },
        "[rate-limit] first-request IP detection"
      );
    }
    next();
  };
}
