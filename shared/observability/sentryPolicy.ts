import { maskEmail } from "../utils/maskEmail";

import { DROP_PATTERNS, EXTENSION_PROTOCOLS, type DropReason } from "./sentryNoise";

/**
 * Politique d'émission commune au serveur, aux jobs et à l'UI.
 *
 * L'événement est typé structurellement plutôt qu'avec `@sentry/types` : ça évite
 * d'ajouter une dépendance à `shared` et survit à la migration v10, où le paquet
 * est déprécié.
 */

export type SentryFrame = { filename?: string; abs_path?: string; in_app?: boolean };

export type SentryExceptionValue = {
  type?: string;
  value?: string;
  stacktrace?: { frames?: SentryFrame[] };
};

export type SentryEventLike = {
  message?: string;
  exception?: { values?: SentryExceptionValue[] };
  tags?: Record<string, unknown>;
  extra?: Record<string, unknown>;
  contexts?: Record<string, unknown>;
  user?: Record<string, unknown>;
  request?: { headers?: Record<string, string>; data?: unknown; url?: string };
  fingerprint?: string[];
};

export const ALERT_TIERS = ["oncall", "jour", "veille"] as const;
export type AlertTier = (typeof ALERT_TIERS)[number];

export const DEFAULT_ALERT_TIER: AlertTier = "veille";

/**
 * Clés de tag autorisées. Un tag est indexé par Sentry : une valeur non bornée
 * (siret, uai, ObjectId) rend le filtrage des règles d'alerte inutilisable.
 * Tout le reste bascule en `extra`, consultable mais non indexé.
 */
export const TAG_ALLOWLIST: readonly string[] = [
  // contrat d'alerte
  "alert_tier",
  "runtime",
  "error_kind",
  "http_status_class",
  "route_group",
  "job_kind",
  // applicatifs déjà en place
  "job",
  "upstream",
  "http.method",
  "drop_reason",
  // posés par le SDK ou l'instance
  "transaction",
  "url",
  "environment",
  "release",
  "server_name",
  "handled",
  "mechanism",
  "level",
  "logger",
  "browser",
  "browser.name",
  "os",
  "os.name",
  "device",
  "device.family",
  "runtime.name",
  "runtime.version",
  "user",
  "replayId",
  "sample_rate",
  "sentry_version",
];

const MAX_TAG_VALUE_LENGTH = 200;
const MAX_SCRUB_DEPTH = 6;
/**
 * Le `(?<!\*)` rend le masquage idempotent : sans lui, `jea*******t@cfa.fr`
 * serait re-matché à partir du `t` et perdrait un caractère à chaque passage.
 */
const EMAIL_PATTERN = /(?<!\*)[\w.+-]+@[\w-]+\.[\w.-]+/g;
const SENSITIVE_HEADERS = ["authorization", "cookie", "set-cookie", "x-api-key", "proxy-authorization"];

/** Neutralise les valeurs variables, sinon chaque identifiant fabrique son propre groupe. */
export function normalizeForGrouping(text: string): string {
  return text
    .replace(/[0-9a-f]{24}\b/gi, "<id>")
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "<uuid>")
    .replace(/\d{4}-\d{2}-\d{2}(?:T[\d:.]+Z?)?/g, "<date>")
    .replace(/\d+/g, "<n>")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TAG_VALUE_LENGTH);
}

function messagesOf(event: SentryEventLike): string[] {
  const fromException = (event.exception?.values ?? []).flatMap(({ type, value }) =>
    [type, value].filter((part): part is string => typeof part === "string" && part.length > 0)
  );
  return event.message ? [...fromException, event.message] : fromException;
}

function matches(text: string, pattern: string | RegExp): boolean {
  return typeof pattern === "string" ? text.includes(pattern) : pattern.test(text);
}

function isExtensionFrame(frame: SentryFrame): boolean {
  const location = frame.abs_path ?? frame.filename ?? "";
  return EXTENSION_PROTOCOLS.some((protocol) => location.startsWith(protocol));
}

/**
 * Une frame d'extension isolée ne suffit pas : les extensions s'injectent dans des
 * piles applicatives légitimes. On ne rejette que si aucune frame applicative ne
 * nous appartient.
 */
function isFullyExtensionStack(event: SentryEventLike): boolean {
  const frames = (event.exception?.values ?? []).flatMap((value) => value.stacktrace?.frames ?? []);
  if (frames.length === 0) return false;

  const candidates = frames.some((frame) => frame.in_app) ? frames.filter((frame) => frame.in_app) : frames;
  return candidates.every(isExtensionFrame);
}

/**
 * Retourne la raison du rejet, ou `null` si l'événement doit être conservé.
 *
 * `reasons` est explicite et sans défaut : appliquer les motifs du navigateur au
 * serveur y masquerait des pannes d'API amont.
 */
export function classifyDrop(event: SentryEventLike, reasons: readonly DropReason[]): DropReason | null {
  const active = new Set(reasons);
  const texts = messagesOf(event);

  for (const { reason, patterns } of DROP_PATTERNS) {
    if (!active.has(reason)) continue;
    if (texts.some((text) => patterns.some((pattern) => matches(text, pattern)))) {
      return reason;
    }
  }

  return active.has("browser-extension") && isFullyExtensionStack(event) ? "browser-extension" : null;
}

function maskEmailsInText(text: string): string {
  return text.replace(EMAIL_PATTERN, (email) => maskEmail(email));
}

function scrubValue(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (typeof value === "string") return maskEmailsInText(value);
  if (depth >= MAX_SCRUB_DEPTH || value === null || typeof value !== "object") return value;
  if (seen.has(value)) return value;
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => scrubValue(item, depth + 1, seen));
  }

  const entries = Object.entries(value as Record<string, unknown>);
  for (const [key, nested] of entries) {
    (value as Record<string, unknown>)[key] = scrubValue(nested, depth + 1, seen);
  }
  return value;
}

/** Retire les IP et masque les adresses e-mail, où qu'elles se trouvent dans l'événement. */
export function scrubPii<T extends SentryEventLike>(event: T): T {
  const seen = new WeakSet<object>();

  if (event.user) {
    delete event.user.ip_address;
    // Clé invalide côté Sentry, mais l'IP partait quand même.
    delete event.user.ip;
  }

  if (event.request?.headers) {
    for (const header of Object.keys(event.request.headers)) {
      if (SENSITIVE_HEADERS.includes(header.toLowerCase())) {
        delete event.request.headers[header];
      }
    }
  }

  for (const section of ["user", "tags", "extra", "contexts"] as const) {
    const value = event[section];
    if (value) scrubValue(value, 0, seen);
  }
  if (event.request?.data !== undefined) {
    event.request.data = scrubValue(event.request.data, 0, seen);
  }
  if (event.message) event.message = maskEmailsInText(event.message);
  for (const value of event.exception?.values ?? []) {
    if (value.value) value.value = maskEmailsInText(value.value);
  }

  return event;
}

/**
 * Applique l'allowlist et le niveau par défaut. Un tag refusé n'est pas perdu :
 * il bascule en `extra`, sous le préfixe `tag.`.
 */
export function enforceTagPolicy<T extends SentryEventLike>(event: T): T {
  const tags = event.tags ?? {};
  const kept: Record<string, unknown> = {};
  const demoted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(tags)) {
    const tooLong = typeof value === "string" && value.length > MAX_TAG_VALUE_LENGTH;
    if (TAG_ALLOWLIST.includes(key) && !tooLong) {
      kept[key] = value;
    } else {
      demoted[`tag.${key}`] = value;
    }
  }

  if (!ALERT_TIERS.includes(kept.alert_tier as AlertTier)) {
    kept.alert_tier = DEFAULT_ALERT_TIER;
  }

  event.tags = kept;
  if (Object.keys(demoted).length > 0) {
    event.extra = { ...(event.extra ?? {}), ...demoted };
  }
  return event;
}

export type BeforeSendOptions<T extends SentryEventLike> = {
  /** Catégories rejetées pour ce runtime. Omises, aucun événement n'est supprimé. */
  dropReasons?: readonly DropReason[];
  /**
   * Semaine d'observation : les événements rejetés sont taggés `drop_reason`
   * au lieu d'être supprimés, pour mesurer avant de couper.
   */
  debug?: boolean;
  /** Enrichissement propre au runtime, appliqué avant la décision de rejet. */
  enrich?: (event: T) => T;
};

export function buildBeforeSend<T extends SentryEventLike>({
  dropReasons = [],
  debug = false,
  enrich,
}: BeforeSendOptions<T> = {}) {
  return (event: T): T | null => {
    const enriched = enrich ? enrich(event) : event;

    const dropReason = classifyDrop(enriched, dropReasons);
    if (dropReason && !debug) return null;
    if (dropReason) {
      enriched.tags = { ...(enriched.tags ?? {}), drop_reason: dropReason };
    }

    return enforceTagPolicy(scrubPii(enriched));
  };
}
