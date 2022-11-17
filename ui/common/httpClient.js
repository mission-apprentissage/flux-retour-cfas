import { emitter } from "./emitter";
import axios from "axios";
import * as https from "https";

class AuthError extends Error {
  constructor(json, statusCode) {
    super(`Request rejected with status code ${statusCode}`);
    this.json = json;
    this.statusCode = statusCode;
    this.prettyMessage = "Identifiant ou mot de passe invalide";
  }
}

class HTTPError extends Error {
  constructor(message, json, statusCode, messages = null) {
    super(message);
    this.json = json;
    this.messages = messages;
    this.statusCode = statusCode;
    this.prettyMessage = "Une erreur technique est survenue";
  }
}

const handleResponse = (path, response) => {
  let statusCode = response.status;
  if (statusCode >= 400 && statusCode < 600) {
    emitter.emit("http:error", response);

    if (statusCode === 401 || statusCode === 403) {
      throw new AuthError(response, statusCode);
    } else {
      const messages = response.data;
      throw new HTTPError(
        `Server returned ${statusCode} when requesting resource ${path}`,
        response,
        statusCode,
        messages
      );
    }
  }
  return response.data;
};

const getHeaders = (contentType = "application/json") => {
  return {
    Accept: "application/json",
    ...(contentType ? { "Content-Type": contentType } : {}),
  };
};

const getHttpsAgent = () => {
  return typeof window === "undefined"
    ? new https.Agent({
        rejectUnauthorized: false,
      })
    : undefined;
};

export const _get = async (path, signal) => {
  const response = await axios.get(path, {
    headers: getHeaders(),
    signal,
    validateStatus: () => true,
    httpsAgent: getHttpsAgent(),
  });
  return handleResponse(path, response);
};

export const _post = async (path, body, signal) => {
  const response = await axios.post(path, body, {
    headers: getHeaders(),
    validateStatus: () => true,
    signal,
    httpsAgent: getHttpsAgent(),
  });
  return handleResponse(path, response);
};

export const _postFile = async (path, data, signal) => {
  const response = await axios.post(path, data, {
    headers: getHeaders(),
    validateStatus: () => true,
    signal,
    httpsAgent: getHttpsAgent(),
  });
  return handleResponse(path, response);
};

export const _put = async (path, body = {}, signal) => {
  const response = await axios.put(path, body, {
    headers: getHeaders(),
    validateStatus: () => true,
    signal,
    httpsAgent: getHttpsAgent(),
  });
  return handleResponse(path, response);
};

export const _delete = async (path, signal) => {
  const response = await axios.delete(path, {
    headers: getHeaders(),
    validateStatus: () => true,
    signal,
    httpsAgent: getHttpsAgent(),
  });
  return handleResponse(path, response);
};
