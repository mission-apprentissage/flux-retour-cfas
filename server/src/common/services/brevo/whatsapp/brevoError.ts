import axios from "axios";

import { captureTiered } from "@/common/services/sentry/alertContract";
import { getErrorMessage } from "@/common/utils/errorUtils";

export type BrevoOperation = "send_message" | "upsert_contact" | "send_template";

export interface BrevoErrorDetails {
  status?: number;
  code?: string;
  message: string;
  /** Échec transitoire : pas de réponse, 5xx, 408 ou 429. Un 4xx est un refus définitif. */
  retryable: boolean;
  /**
   * La requête n'a sûrement pas été traitée, donc la rejouer ne peut pas doubler un message.
   * Faux pour un timeout, une coupure en cours de route ou un 500 : Brevo a pu envoyer sans que
   * nous recevions la réponse.
   */
  safeToRetry: boolean;
}

class BrevoApiError extends Error {
  constructor(
    readonly operation: BrevoOperation,
    readonly details: BrevoErrorDetails
  ) {
    super(`Brevo ${operation} a échoué (${details.status ?? details.code ?? "sans réponse"})`);
    this.name = "BrevoApiError";
  }
}

const MAX_MESSAGE_LENGTH = 200;
const MIN_REPORT_INTERVAL_MS = 60 * 60_000;

/**
 * Statuts et codes réseau pour lesquels Brevo n'a rien traité. 502 et 504 en sont exclus :
 * une passerelle peut avoir relayé la requête avant d'échouer.
 */
const NOT_PROCESSED_STATUSES = new Set([429, 503]);
const NOT_PROCESSED_NETWORK_CODES = new Set(["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN"]);

const MIN_SENSITIVE_VALUE_LENGTH = 3;

const lastReport = new Map<string, { at: number; suppressed: number }>();

export function resetBrevoErrorReports(): void {
  lastReport.clear();
}

/** Les noms de champs (`TBA_EFFECTIF_PRENOM_WHATSAPP`, `templateId`) aident au diagnostic et ne sont pas des données. */
const FIELD_NAME = /^(?:[A-Z0-9]+_[A-Z0-9_]+|[a-z]+[A-Z]\w*)$/;

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Le message d'erreur de Brevo peut citer une donnée que nous lui avons envoyée : prénom, numéro, e-mail.
 * On masque d'abord les valeurs que l'appelant sait avoir transmises (`sensitiveValues`), la seule protection
 * qui couvre un prénom cité sans guillemets. Puis ce qui ressemble à un numéro (9 chiffres ou plus), à un e-mail,
 * ou à un texte entre guillemets qui n'est pas un nom de champ. Enfin on borne la longueur.
 */
export function sanitizeBrevoText(text: string, sensitiveValues: readonly string[] = []): string {
  let sanitized = text;
  for (const value of sensitiveValues) {
    const trimmed = value.trim();
    if (trimmed.length >= MIN_SENSITIVE_VALUE_LENGTH) {
      sanitized = sanitized.replace(new RegExp(escapeRegExp(trimmed), "gi"), "<valeur>");
    }
  }
  return sanitized
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "<email>")
    .replace(/\+?\d(?:[\s.()-]?\d){8,}/g, "<tel>")
    .replace(
      /"([^"]*)"|`([^`]*)`|«([^»]*)»|“([^”]*)”|(?<![\p{L}\d])'([^']*)'(?![\p{L}\d])/gu,
      (whole, ...groups: (string | undefined)[]) => {
        const quoted = groups.slice(0, 5).find((group) => group !== undefined) ?? "";
        return FIELD_NAME.test(quoted) ? whole : "<valeur>";
      }
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);
}

const isRetryableStatus = (status: number): boolean => status >= 500 || status === 429 || status === 408;

const asString = (value: unknown): string | undefined => (typeof value === "string" && value ? value : undefined);

/**
 * Résume une erreur d'appel Brevo sans jamais exposer la requête (corps, en-têtes avec la clé API,
 * numéro de téléphone, prénom). Seuls le statut, le code et le message de la réponse, assainis, en sortent.
 * `sensitiveValues` : les données personnelles envoyées dans la requête, à masquer si Brevo les cite.
 */
export function describeBrevoError(error: unknown, sensitiveValues: readonly string[] = []): BrevoErrorDetails {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as { code?: unknown; message?: unknown } | undefined;
    const code = asString(data?.code) ?? error.code;
    const rawMessage = asString(data?.message) ?? error.message;
    return {
      status,
      code: code ? sanitizeBrevoText(code, sensitiveValues) : undefined,
      message: sanitizeBrevoText(rawMessage || "Unknown error", sensitiveValues),
      // Sans réponse (timeout, coupure réseau, DNS), l'échec est transitoire.
      retryable: status === undefined ? true : isRetryableStatus(status),
      safeToRetry:
        status === undefined ? NOT_PROCESSED_NETWORK_CODES.has(error.code ?? "") : NOT_PROCESSED_STATUSES.has(status),
    };
  }
  return {
    message: sanitizeBrevoText(getErrorMessage(error) || "Unknown error", sensitiveValues),
    retryable: false,
    safeToRetry: false,
  };
}

/** Champs de log d'un échec Brevo : `error` conserve le nom historique du message. */
export function brevoErrorLogFields({ message, ...details }: BrevoErrorDetails): Record<string, unknown> {
  return { error: message, ...details };
}

/**
 * Une capture par type d'échec, par heure et par processus : le job quotidien enchaîne jusqu'à
 * 500 appels, et un 400 systématique produirait autant d'événements identiques. Les occurrences
 * écartées sont comptées (`suppressedSinceLastReport`) ; chaque échec reste dans les logs.
 * Le corps assaini de la réponse part en `extra`, `scrubPii` ayant déjà retiré celui de l'AxiosError.
 * Aucun palier n'est posé : le contrat d'alerte décide (`jour` dans le job quotidien, `veille` ailleurs).
 * Sans statut ni code, l'erreur ne vient pas de Brevo mais du code appelant : c'est un bug, pas une panne amont.
 */
export function reportBrevoError(operation: BrevoOperation, details: BrevoErrorDetails): void {
  const fromBrevo = details.status !== undefined || details.code !== undefined;
  const key = `brevo-whatsapp:${operation}:${details.status ?? details.code ?? "erreur-interne"}`;
  const now = Date.now();
  const previous = lastReport.get(key);
  if (previous && now - previous.at < MIN_REPORT_INTERVAL_MS) {
    previous.suppressed++;
    return;
  }
  lastReport.set(key, { at: now, suppressed: 0 });

  captureTiered(new BrevoApiError(operation, details), {
    errorKind: fromBrevo ? "upstream" : "bug",
    upstream: fromBrevo ? "brevo" : undefined,
    fingerprintKey: key,
    extra: {
      operation,
      status: details.status,
      brevoCode: details.code,
      brevoMessage: details.message,
      suppressedSinceLastReport: previous?.suppressed ?? 0,
    },
  });
}
