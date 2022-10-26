import { getAuth, resetAuth } from "./auth/auth";

class AuthError extends Error {
  constructor(json, statusCode) {
    super(`Request rejected with status code ${statusCode}`);
    this.json = json;
    this.statusCode = statusCode;
    this.prettyMessage = "Identifiant ou mot de passe invalide";
  }
}

class HTTPError extends Error {
  constructor(message, json, statusCode) {
    super(message);
    this.json = json;
    this.statusCode = statusCode;
    this.prettyMessage = "Une erreur technique est survenue";
  }
}

const handleResponse = (path, response, options = {}) => {
  const { jsonResponse = true } = options;

  let statusCode = response.status;
  if (statusCode >= 400 && statusCode < 600) {
    if (statusCode === 401) {
      resetAuth();
      throw new AuthError(response.json(), statusCode);
    }
    if (statusCode === 403) {
      throw new AuthError(response.json(), statusCode);
    }
    throw new HTTPError(`Server returned ${statusCode} when requesting resource ${path}`, response.json(), statusCode);
  }
  return jsonResponse ? response.json() : response;
};

const getHeaders = () => {
  let auth = getAuth();

  return {
    Accept: "application/json",
    ...(auth ? { Authorization: `Bearer ${auth.access_token}` } : {}),
    "Content-Type": "application/json",
  };
};

export const _get = (path, options) => {
  return fetch(path, {
    method: "GET",
    headers: getHeaders(),
  }).then((res) => handleResponse(path, res, options));
};

export const _post = (path, body) => {
  return fetch(`${path}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  }).then((res) => handleResponse(path, res));
};

export const _postFormData = (path, formData) => {
  // Remove contentType from headers for sending form-data
  const headers = getHeaders();
  const formDataHeaders = { ...(delete headers["Content-Type"] && headers) };

  return fetch(`${path}`, {
    method: "POST",
    headers: formDataHeaders,
    body: formData,
  }).then((res) => handleResponse(path, res));
};

export const _put = (path, body = {}) => {
  return fetch(`${path}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(body),
  }).then((res) => handleResponse(path, res));
};

export const _delete = (path) => {
  return fetch(`${path}`, {
    method: "DELETE",
    headers: getHeaders(),
  }).then((res) => handleResponse(path, res));
};
