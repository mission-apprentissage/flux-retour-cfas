import { parse as parseUrl } from "url"; // eslint-disable-line node/no-deprecated-api
import https from "https";
import { oleoduc, compose, transformIntoJSON } from "oleoduc";
import logger from "../logger.js";
import { COOKIE_NAME } from "../constants/cookieName.js";

export const sendTransformedPaginatedJsonStream = (stream, arrayPropertyName, pagination, res) => {
  res.setHeader("Content-Type", "application/json");
  oleoduc(
    compose(
      stream,
      transformIntoJSON({
        arrayPropertyName: arrayPropertyName,
        arrayWrapper: {
          pagination,
        },
      })
    ),
    res
  );
};

export async function createRequestStream(url, httpOptions = {}) {
  return new Promise((resolve, reject) => {
    let options = {
      ...parseUrl(url),
      method: "GET",
      ...httpOptions,
    };

    logger.info(`Send http request [${options.method}] ${url}...`);
    let req = https.request(options, (/** @type {any}*/ res) => {
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

export function responseWithCookie({ res, token }) {
  return res.cookie(COOKIE_NAME, token, {
    maxAge: 30 * 24 * 3600000,
    httpOnly: true,
    sameSite: "lax",
    secure: true,
  });
}

export function sendHTML(html, res) {
  res.set("Content-Type", "text/html");
  res.send(Buffer.from(html));
}
