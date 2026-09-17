import { AxiosResponse } from "axios";

export const RATE_LIMIT_STATUS = 429;

/** Lit `Retry-After` (s) d'une 429. `null` si absent (ex. header non exposé en cross-origin). */
function getRetryAfterSeconds(response: { headers?: AxiosResponse["headers"] } | undefined): number | null {
  const raw = response?.headers?.["retry-after"];
  const seconds = raw != null ? Number(raw) : NaN;
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

/** Message rate-limiting convivial, avec le délai si disponible. */
export function formatRateLimitMessage(response?: { headers?: AxiosResponse["headers"] }): string {
  const seconds = getRetryAfterSeconds(response);
  if (seconds == null) {
    return "Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.";
  }
  if (seconds < 60) {
    return `Trop de tentatives. Veuillez réessayer dans ${seconds} seconde${seconds > 1 ? "s" : ""}.`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `Trop de tentatives. Veuillez réessayer dans ${minutes} minute${minutes > 1 ? "s" : ""}.`;
}

/** Vrai si l'erreur httpClient correspond à un 429. */
interface ApiErrorShape {
  statusCode?: number;
  message?: string;
  json?: { status?: number; headers?: AxiosResponse["headers"]; data?: { message?: string } };
}

const asApiError = (err: unknown): ApiErrorShape =>
  (typeof err === "object" && err !== null ? err : {}) as ApiErrorShape;

export function isRateLimited(err: unknown): boolean {
  const error = asApiError(err);
  return error.statusCode === RATE_LIMIT_STATUS || error.json?.status === RATE_LIMIT_STATUS;
}

/** Code HTTP porté par une erreur httpClient, si connu. */
export function getErrorStatusCode(err: unknown): number | undefined {
  const error = asApiError(err);
  return error.json?.status ?? error.statusCode;
}

/** Message renvoyé par le serveur, sinon fallback. */
export function getServerErrorMessage(err: unknown, fallback: string): string {
  return asApiError(err).json?.data?.message || fallback;
}

/** Message à afficher : message 429 si rate-limité, sinon message serveur puis fallback. */
export function getApiErrorMessage(err: unknown, fallback = "Une erreur technique est survenue"): string {
  const error = asApiError(err);
  if (isRateLimited(err)) {
    return formatRateLimitMessage(error.json);
  }
  return error.json?.data?.message || error.message || fallback;
}
