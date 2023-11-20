import https from "https";
import { parse as parseUrl } from "url"; // eslint-disable-line node/no-deprecated-api

import { Response } from "express";

import { COOKIE_NAME } from "@/common/constants/cookieName";
import logger from "@/common/logger";

export async function createRequestStream(url, httpOptions = {}) {
  return new Promise((resolve, reject) => {
    let options = {
      ...parseUrl(url),
      method: "GET",
      ...httpOptions,
    };

    logger.info(`Send http request [${options.method}] ${url}...`);
    let req = https.request(options, (res: any) => {
      if (res.statusCode >= 400) {
        reject(new Error(`Unable to get ${url}. Status code ${res.statusCode}`));
      }

      resolve(res);
    });
    req.end();
  });
}

export function createUploadStream(url, httpOptions = {}) {
  let options = {
    ...parseUrl(url),
    method: "PUT",
    ...httpOptions,
  };

  logger.info(`Uploading ${url}...`);
  return https.request(options);
}

export function responseWithCookie(res: Response, token: string) {
  return res.cookie(COOKIE_NAME, token, {
    maxAge: 6 * 24 * 60 * 60 * 1000, // 6 jours (unité en millisecondes)
    httpOnly: true,
    sameSite: "lax",
    secure: true,
  });
}
