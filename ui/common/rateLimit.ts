import { AxiosResponse } from "axios";

export const RATE_LIMIT_STATUS = 429;

/** Lit `Retry-After` (s) d'une 429. `null` si absent (ex. header non exposé en cross-origin). */
function getRetryAfterSeconds(response: Pick<AxiosResponse, "headers"> | undefined): number | null {
  const raw = response?.headers?.["retry-after"];
  const seconds = raw != null ? Number(raw) : NaN;
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

/** Message rate-limiting convivial, avec le délai si disponible. */
export function formatRateLimitMessage(response?: Pick<AxiosResponse, "headers">): string {
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
export function isRateLimited(err: any): boolean {
  return err?.statusCode === RATE_LIMIT_STATUS || err?.json?.status === RATE_LIMIT_STATUS;
}

/** Message à afficher : message 429 si rate-limité, sinon message serveur puis fallback. */
export function getApiErrorMessage(err: any, fallback = "Une erreur technique est survenue"): string {
  if (isRateLimited(err)) {
    return formatRateLimitMessage(err?.json);
  }
  return err?.json?.data?.message || err?.message || fallback;
}
