import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import mime from "mime";

import { publicConfig } from "@/config.public";

import { emitter } from "./emitter";
import { formatRateLimitMessage, RATE_LIMIT_STATUS } from "./rateLimit";

if (publicConfig.env === "local") {
  axios.defaults.withCredentials = true;
}

class AuthError extends Error {
  json: AxiosResponse;
  statusCode: number;
  prettyMessage: string;

  constructor(json: AxiosResponse, statusCode: number) {
    super(`Request rejected with status code ${statusCode}`);
    this.json = json;
    this.statusCode = statusCode;
    this.prettyMessage = "Identifiant ou mot de passe invalide";
  }
}

export class HTTPError extends Error {
  json: AxiosResponse;
  messages: unknown;
  statusCode: number;
  prettyMessage: string;

  constructor(message: string, json: AxiosResponse, statusCode: number, messages: unknown = null) {
    super(message);
    this.json = json;
    this.messages = messages;
    this.statusCode = statusCode;
    this.prettyMessage =
      statusCode === RATE_LIMIT_STATUS ? formatRateLimitMessage(json) : "Une erreur technique est survenue";
  }
}

const handleResponse = <T = unknown>(path: string, response: AxiosResponse): T => {
  const statusCode = response.status;
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

const getHeaders = (contentType: string | null = "application/json") => {
  return {
    Accept: "application/json",
    ...(contentType ? { "Content-Type": contentType } : {}),
  };
};

/**
 * Récupère un fichier exposé par l'UI.
 * Nécessaire pour l'environnement local, car les ports sont maintenant exposés.
 */
export const _getUI = async <T = unknown>(path: string, options?: AxiosRequestConfig): Promise<T> => {
  const response = await axios.get(path, {
    headers: getHeaders(),
    validateStatus: () => true,
    ...options,
  });
  return handleResponse<T>(path, response);
};

export const _get = async <T = unknown>(path: string, options?: AxiosRequestConfig): Promise<T> => {
  const response = await axios.get(`${publicConfig.baseUrl}${path}`, {
    headers: getHeaders(),
    validateStatus: () => true,
    ...options,
  });
  return handleResponse<T>(path, response);
};

export const _getBlob = async (path: string, options?: AxiosRequestConfig) => {
  const response = await axios.get(`${publicConfig.baseUrl}${path}`, {
    headers: getHeaders(),
    validateStatus: () => true,
    responseType: "blob",
    ...options,
  });
  const contentType = response.headers["content-type"];
  return {
    data: handleResponse<Blob>(path, response),
    extension: typeof contentType === "string" ? mime.getExtension(contentType) : null,
  };
};

export const _post = async <RequestBody = unknown, ResponseBody = unknown>(
  path: string,
  body?: RequestBody,
  options?: AxiosRequestConfig
): Promise<ResponseBody> => {
  const response = await axios.post(`${publicConfig.baseUrl}${path}`, body, {
    headers: getHeaders(),
    validateStatus: () => true,
    ...options,
  });
  return handleResponse<ResponseBody>(path, response);
};

export const _put = async <ResponseBody = unknown>(path: string, body: unknown = {}, options?: AxiosRequestConfig) => {
  const response = await axios.put(`${publicConfig.baseUrl}${path}`, body, {
    headers: getHeaders(),
    validateStatus: () => true,
    ...options,
  });
  return handleResponse<ResponseBody>(path, response);
};

export const _delete = async <ResponseBody = unknown>(path: string, options?: AxiosRequestConfig) => {
  const response = await axios.delete(`${publicConfig.baseUrl}${path}`, {
    headers: getHeaders(),
    validateStatus: () => true,
    ...options,
  });
  return handleResponse<ResponseBody>(path, response);
};
