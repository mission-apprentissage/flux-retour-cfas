import * as https from "https";

import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import mime from "mime";

import { publicConfig } from "@/config.public";

import { emitter } from "./emitter";

if (publicConfig.env === "local") {
  axios.defaults.withCredentials = true;
}

export class AuthError extends Error {
  json: any;
  statusCode: any;
  prettyMessage: any;

  constructor(json, statusCode) {
    super(`Request rejected with status code ${statusCode}`);
    this.json = json;
    this.statusCode = statusCode;
    this.prettyMessage = "Identifiant ou mot de passe invalide";
  }
}

class HTTPError extends Error {
  json: any;
  messages: any;
  statusCode: any;
  prettyMessage: any;

  constructor(message, json, statusCode, messages = null) {
    super(message);
    this.json = json;
    this.messages = messages;
    this.statusCode = statusCode;
    this.prettyMessage = "Une erreur technique est survenue";
  }
}

const handleResponse = <T = any>(path: string, response: AxiosResponse): T => {
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

const getHttpsAgent = () => {
  return typeof window === "undefined"
    ? new https.Agent({
        rejectUnauthorized: false,
      })
    : undefined;
};

/**
 * Récupère un fichier exposé par l'UI.
 * Nécessaire pour l'environnement local, car les ports sont maintenant exposés.
 */
export const _getUI = async <T = any>(path: string, options?: AxiosRequestConfig<any>): Promise<T> => {
  const response = await axios.get(path, {
    headers: getHeaders(),
    validateStatus: () => true,
    httpsAgent: getHttpsAgent(),
    ...options,
  });
  return handleResponse<T>(path, response);
};

export const _get = async <T = any>(path: string, options?: AxiosRequestConfig<any>): Promise<T> => {
  const response = await axios.get(`${publicConfig.baseUrl}${path}`, {
    headers: getHeaders(),
    validateStatus: () => true,
    httpsAgent: getHttpsAgent(),
    ...options,
  });
  return handleResponse<T>(path, response);
};

export const _getBlob = async (path: string, options?: AxiosRequestConfig<any>) => {
  const response = await axios.get(`${publicConfig.baseUrl}${path}`, {
    headers: getHeaders(),
    validateStatus: () => true,
    httpsAgent: getHttpsAgent(),
    responseType: "blob",
    ...options,
  });
  return { data: handleResponse(path, response), extension: mime.getExtension(response.headers["content-type"]) };
};

export const _post = async <RequestBody = any, ResponseBody = any>(
  path: string,
  body?: RequestBody,
  options?: AxiosRequestConfig<any>
): Promise<ResponseBody> => {
  const response = await axios.post(`${publicConfig.baseUrl}${path}`, body, {
    headers: getHeaders(),
    validateStatus: () => true,
    httpsAgent: getHttpsAgent(),
    ...options,
  });
  return handleResponse<ResponseBody>(path, response);
};

export const _put = async (path: string, body = {}, options?: AxiosRequestConfig<any>) => {
  const response = await axios.put(`${publicConfig.baseUrl}${path}`, body, {
    headers: getHeaders(),
    validateStatus: () => true,
    httpsAgent: getHttpsAgent(),
    ...options,
  });
  return handleResponse(path, response);
};

export const _delete = async (path: string, options?: AxiosRequestConfig<any>) => {
  const response = await axios.delete(`${publicConfig.baseUrl}${path}`, {
    headers: getHeaders(),
    validateStatus: () => true,
    httpsAgent: getHttpsAgent(),
    ...options,
  });
  return handleResponse(path, response);
};
