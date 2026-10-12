import { captureException, withScope } from "@sentry/node";
import { type AlertTier, type SentryEventLike } from "shared/observability/sentryPolicy";

export type ErrorKind = "validation" | "auth" | "rate-limit" | "upstream" | "db" | "config" | "data-drift" | "bug";

/**
 * Niveau d'alerte par nom de job ou de cron.
 *
 * `job-processor` pose déjà `scope.setTag("job", job.name)` sur tous les événements
 * de jobs : cette table suffit donc à classer l'ensemble sans toucher un handler.
 *
 * Deux familles y figurent, et la seconde est la moins évidente :
 *  - les crons, dont l'échec est visible depuis leur monitor ;
 *  - les jobs **enfilés par un cron**, dont l'échec ne l'est pas — le cron se
 *    termine en succès dès qu'il a enfilé. Sans entrée ici, leur échec resterait
 *    en `veille`, donc silencieux.
 *
 * Tout ce qui n'est pas listé vaut `veille` : un job lancé à la main n'alerte
 * personne. Le test associé refuse qu'un cron du registre soit absent.
 */
export const JOB_META: Record<string, { tier: AlertTier }> = {
  // ─── Crons ────────────────────────────────────────────────────────────────
  // `jour` quand l'échec se voit côté usager dans la journée : fraîcheur des
  // données, envoi d'e-mails ou de messages, recalcul de statuts.
  "Run daily jobs each day at 02h30": { tier: "jour" },
  "Import formations": { tier: "jour" },
  "Nettoie et met à jour les statistiques des Missions Locales": { tier: "jour" },
  "Synchro Brevo de tous les contacts TBA à 5h": { tier: "jour" },
  "Mettre à jour les statuts d'effectifs tous les samedis matin à 5h": { tier: "jour" },
  "Send CFA daily recap at 10h30": { tier: "jour" },
  "hydrate:contrats-deca-raw": { tier: "jour" },
  "Send ML daily recap at 13h30": { tier: "jour" },
  "Send ML weekly recap at 14h30 on Mondays": { tier: "jour" },
  "Envoi WhatsApp préqualif quotidien à 18h30": { tier: "jour" },
  // Le cron lui-même en « jour » : c'est son contenu qui pose « oncall » quand la
  // file d'ingestion n'avance plus, pas son échec technique.
  "Vérifie que l'ingestion avance toutes les 15 min": { tier: "jour" },
  "heartbeat:ingestion": { tier: "jour" },
  // `veille` : nettoyage, révocation, contrôle de cohérence. Un report d'un jour
  // ne change rien pour personne.
  // Import mensuel du référentiel de voies : son échec dégrade la résolution des
  // codes INSEE à l'ingestion, donc la précision des adresses.
  "hydrate:communes-voies": { tier: "jour" },
  "Cleanup organismes": { tier: "veille" },
  "Révoque les clés API des organismes inactifs depuis +12 mois, tous les jours à 4h": { tier: "veille" },
  "Validation des constantes de territoires": { tier: "veille" },

  // ─── Jobs enfilés par le cron de 02h30 ────────────────────────────────────
  "hydrate:daily": { tier: "jour" },
  "hydrate:formations-catalogue": { tier: "jour" },
  "import:formation": { tier: "jour" },
  "hydrate:organismes": { tier: "jour" },
  "hydrate:organismes-organisations": { tier: "jour" },
  "hydrate:organismes-has-account": { tier: "jour" },
  "hydrate:organismes-relations": { tier: "jour" },
  "hydrate:organismes-formations-count": { tier: "jour" },
  "hydrate:opcos": { tier: "jour" },
  "hydrate:ofa-inconnus": { tier: "jour" },
  "fiabilisation:uai-siret:run": { tier: "jour" },
  "hydrate:effectifs-formation-niveaux": { tier: "jour" },
  "purge:queues": { tier: "jour" },
  "hydrate:organismes-effectifs-count": { tier: "jour" },
  "fiabilisation:effectifs:transform-inscritsSansContrats-en-abandons-depuis": { tier: "jour" },
  "fiabilisation:effectifs:transform-rupturants-en-abandons-depuis": { tier: "jour" },
  "hydrate:rncp": { tier: "jour" },
  "computed:update": { tier: "jour" },
  "organisme:cleanup": { tier: "jour" },
  "hydrate:transmission-daily": { tier: "jour" },

  // ─── Jobs enfilés par les autres crons ────────────────────────────────────
  "brevo-contacts:sync": { tier: "jour" },
  "whatsapp:send-prequalif-daily": { tier: "jour" },
  "send-mission-locale-weekly-recap": { tier: "jour" },
  "send-mission-locale-daily-recap": { tier: "jour" },
  "send-cfa-daily-recap": { tier: "jour" },
  "organismes:revoke-stale-api-keys": { tier: "veille" },
};

type JobContext = { type?: string };

function jobKindOf(event: SentryEventLike): string | null {
  const job = event.contexts?.job as JobContext | undefined;
  if (job?.type === "cron_task" || job?.type === "cron") return "cron";
  if (job?.type === "simple") return "simple";
  return null;
}

/**
 * Enrichissement appliqué à tout événement du serveur et des jobs, avant la
 * décision de rejet. Un `alert_tier` déjà posé par le code n'est jamais écrasé :
 * la table ne fait que combler les silences.
 */
export function applyAlertContract<T extends SentryEventLike>(event: T): T {
  const tags = { ...(event.tags ?? {}) };
  const jobName = typeof tags.job === "string" ? tags.job : null;

  const kind = jobKindOf(event);
  if (kind && !tags.job_kind) {
    tags.job_kind = kind;
  }

  if (jobName && !tags.alert_tier) {
    const meta = JOB_META[jobName];
    if (meta) tags.alert_tier = meta.tier;
  }

  event.tags = tags;
  return event;
}

export type CaptureTieredOptions = {
  tier: AlertTier;
  errorKind?: ErrorKind;
  /** Nom du service amont, pour les règles qui surveillent les dépendances. */
  upstream?: string;
  /** Clé de regroupement stable. À utiliser dès que le message porte une valeur variable. */
  fingerprintKey?: string;
  /** Les identifiants métier vont ici, jamais en tag. */
  extra?: Record<string, unknown>;
};

/** Point d'entrée unique des captures explicites, pour que le niveau soit lisible sur place. */
export function captureTiered(error: unknown, options: CaptureTieredOptions): void {
  withScope((scope) => {
    scope.setTag("alert_tier", options.tier);
    if (options.errorKind) scope.setTag("error_kind", options.errorKind);
    if (options.upstream) scope.setTag("upstream", options.upstream);
    if (options.fingerprintKey) scope.setFingerprint([options.fingerprintKey]);
    if (options.extra) scope.setContext("détail", options.extra);
    captureException(error);
  });
}
