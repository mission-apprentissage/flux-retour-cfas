/**
 * Catégories d'événements non actionnables, déclarées une seule fois.
 *
 * Les motifs alimentent à la fois `ignoreErrors` à l'init — appliqué par
 * `inboundFiltersIntegration`, donc avant `beforeSend` et moins cher — et
 * `classifyDrop`, qui sert de filet pour ce que les motifs seuls n'expriment pas.
 */

export type DropReason =
  | "expected-auth"
  | "chunk-load"
  | "network"
  | "next-control-flow"
  | "browser-extension"
  | "browser-noise";

export const DROP_PATTERNS: ReadonlyArray<{ reason: DropReason; patterns: ReadonlyArray<string | RegExp> }> = [
  {
    // 401/403 attendus : le front les traite, ils ne décrivent aucun défaut.
    reason: "expected-auth",
    patterns: [/^Request rejected with status code 40[13]$/],
  },
  {
    reason: "chunk-load",
    patterns: [
      "ChunkLoadError",
      /Loading chunk \S+ failed/,
      /Failed to fetch dynamically imported module/,
      /error loading dynamically imported module/i,
      /Importing a module script failed/,
    ],
  },
  {
    // Onglet fermé, navigation annulée, réseau coupé : rien à corriger côté code.
    reason: "network",
    patterns: [
      "AbortError",
      "Failed to fetch",
      "NetworkError when attempting to fetch resource",
      "Load failed",
      "The operation was aborted",
      /^Network request failed$/,
      // Message brut de Safari sur un fetch interrompu. Ancré, sinon il attraperait
      // toute phrase contenant « cancelled ».
      /^(TypeError: )?cancelled$/,
      "The user aborted a request",
    ],
  },
  {
    // Mécanique de contrôle de Next, levée volontairement pendant le rendu.
    reason: "next-control-flow",
    patterns: ["NEXT_REDIRECT", "NEXT_NOT_FOUND", "NEXT_HTTP_ERROR_FALLBACK"],
  },
  {
    reason: "browser-extension",
    patterns: [/extension context invalidated/i],
  },
  {
    reason: "browser-noise",
    patterns: ["ResizeObserver loop completed with undelivered notifications", "ResizeObserver loop limit exceeded"],
  },
];

/**
 * Les catégories ne s'appliquent pas partout, et c'est le point délicat : côté
 * serveur, « Failed to fetch » n'est pas du bruit mais une panne d'API amont.
 * Chaque runtime déclare donc ce qui le concerne, et rien n'est rejeté par défaut.
 */
export const BROWSER_DROP_REASONS: readonly DropReason[] = [
  "expected-auth",
  "chunk-load",
  "network",
  "browser-extension",
  "browser-noise",
];

/** Levé pendant le rendu, donc aussi bien côté serveur Next que dans le navigateur. */
export const NEXT_DROP_REASONS: readonly DropReason[] = ["next-control-flow"];

/** Protocoles de frames dont le code ne nous appartient pas. */
export const EXTENSION_PROTOCOLS: readonly string[] = [
  "chrome-extension://",
  "moz-extension://",
  "safari-extension://",
  "safari-web-extension://",
  "ms-browser-extension://",
  "webkit-masked-url://",
];

/**
 * Motifs à plat pour `ignoreErrors` à l'init. `inboundFiltersIntegration` les
 * applique avant `beforeSend`, donc à moindre coût ; `classifyDrop` reste le
 * filet pour ce qu'un motif seul n'exprime pas, comme la pile d'extension.
 */
export function ignoreErrorsFor(reasons: readonly DropReason[]): Array<string | RegExp> {
  const active = new Set(reasons);
  return DROP_PATTERNS.filter(({ reason }) => active.has(reason)).flatMap(({ patterns }) => [...patterns]);
}

export const DENY_URLS: ReadonlyArray<string | RegExp> = [
  ...EXTENSION_PROTOCOLS.map((protocol) => new RegExp(protocol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))),
  /\/crisp\.chat\//,
  /plausible\.io/,
  /googletagmanager\.com/,
];
