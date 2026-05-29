import Boom from "boom";
import express from "express";
import { Netmask } from "netmask";
import { RateLimiterMemory, RateLimiterMongo, RateLimiterRes } from "rate-limiter-flexible";

import logger from "@/common/logger";
import { getDatabase, getMongodbClient } from "@/common/mongodb";
import config from "@/config";

const RATE_LIMIT_COLLECTION = "rateLimits";
const SENTRY_SAMPLE_RATE = 0.1;

const PRIVATE_CIDRS = ["127.0.0.0/8", "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"].map((c) => new Netmask(c));

export function isPrivateIp(ip: string | undefined): boolean {
  if (!ip) return false;
  const normalized = ip.startsWith("::ffff:") ? ip.slice(7) : ip;
  if (normalized === "::1") return true;
  try {
    return PRIVATE_CIDRS.some((block) => block.contains(normalized));
  } catch {
    return false;
  }
}

const SKIP_PATHS = new Set(["/api", "/api/healthcheck"]);

function shouldSkip(req: express.Request): boolean {
  if (req.method === "OPTIONS") return true;
  if (SKIP_PATHS.has(req.path)) return true;
  if (config.rateLimit.skipPrivateIps && isPrivateIp(req.ip)) return true;
  return false;
}

type TierConfig = { points: number; duration: number; enforce: boolean };

type Store = "mongo" | "memory";

interface BuildOpts {
  tier: string;
  store: Store;
  config: TierConfig;
  getKey: (req: express.Request, res: express.Response) => string | undefined;
}

function createMongoLimiter(keyPrefix: string, opts: TierConfig): RateLimiterMongo {
  return new RateLimiterMongo({
    storeClient: getMongodbClient(),
    dbName: getDatabase().databaseName,
    tableName: RATE_LIMIT_COLLECTION,
    keyPrefix,
    points: opts.points,
    duration: opts.duration,
    inMemoryBlockOnConsumed: opts.points,
    inMemoryBlockDuration: opts.duration,
    insuranceLimiter: new RateLimiterMemory({
      keyPrefix: `${keyPrefix}_ins`,
      points: opts.points,
      duration: opts.duration,
    }),
  });
}

function createMemoryLimiter(keyPrefix: string, opts: TierConfig): RateLimiterMemory {
  return new RateLimiterMemory({
    keyPrefix,
    points: opts.points,
    duration: opts.duration,
  });
}

type LimiterLike = RateLimiterMemory | RateLimiterMongo;
const limiterCache = new Map<string, LimiterLike>();

function getLimiter(tier: string, store: Store, opts: TierConfig): LimiterLike {
  const cached = limiterCache.get(tier);
  if (cached) return cached;
  const built = store === "mongo" ? createMongoLimiter(tier, opts) : createMemoryLimiter(tier, opts);
  limiterCache.set(tier, built);
  return built;
}

function tryGetLimiter(tier: string, store: Store, opts: TierConfig): LimiterLike | null {
  try {
    return getLimiter(tier, store, opts);
  } catch (err) {
    logger.warn({ tier, err: (err as Error).message }, "[rate-limit] limiter init deferred");
    return null;
  }
}

function setRateLimitInfoHeaders(res: express.Response, opts: TierConfig, result: RateLimiterRes) {
  const resetSec = Math.ceil(result.msBeforeNext / 1000);
  res.setHeader("RateLimit-Limit", String(opts.points));
  res.setHeader("RateLimit-Remaining", String(Math.max(result.remainingPoints, 0)));
  res.setHeader("RateLimit-Reset", String(resetSec));
  res.setHeader("RateLimit-Policy", `${opts.points};w=${opts.duration}`);
}

function setRetryAfterHeader(res: express.Response, result: RateLimiterRes) {
  res.setHeader("Retry-After", String(Math.ceil(result.msBeforeNext / 1000)));
}

function build({ tier, store, config: tierConfig, getKey }: BuildOpts): express.RequestHandler {
  return async function rateLimit(req, res, next) {
    if (shouldSkip(req)) return next();

    const key = getKey(req, res);
    if (!key) return next();

    const limiter = tryGetLimiter(tier, store, tierConfig);
    if (!limiter) return next();

    try {
      const result = await limiter.consume(key);
      setRateLimitInfoHeaders(res, tierConfig, result);
      next();
    } catch (err) {
      if (err instanceof RateLimiterRes) {
        const meta = {
          tier,
          key,
          ip: req.ip,
          userId: (req.user as any)?._id?.toString?.(),
          route: req.originalUrl,
          retryAfter: Math.ceil(err.msBeforeNext / 1000),
          enforced: tierConfig.enforce,
          would_block: true,
        };
        logger.warn(meta, "[rate-limit] blocked");

        if (Math.random() < SENTRY_SAMPLE_RATE) {
          import("@sentry/node").then(({ captureMessage }) => {
            captureMessage(`[rate-limit] ${tier} blocked`, {
              level: "warning",
              tags: { rate_limit_tier: tier, enforced: String(tierConfig.enforce) },
              extra: meta,
            });
          });
        }

        if (!tierConfig.enforce) {
          return next();
        }
        setRateLimitInfoHeaders(res, tierConfig, err);
        setRetryAfterHeader(res, err);
        return next(Boom.tooManyRequests("Trop de requêtes, veuillez réessayer plus tard."));
      }
      logger.error({ tier, err }, "[rate-limit] consume failed, failing open");
      import("@sentry/node").then(({ captureException }) => {
        captureException(err, { level: "error", tags: { rate_limit_tier: tier } });
      });
      next();
    }
  };
}

const byIp: BuildOpts["getKey"] = (req) => req.ip || "unknown";

const byEmailLowercased: BuildOpts["getKey"] = (req) => {
  const raw = req.body?.email;
  if (typeof raw !== "string") return undefined;
  const normalized = raw.trim().toLowerCase();
  return normalized || undefined;
};

const byUserId: BuildOpts["getKey"] = (req) => {
  const id = (req.user as any)?._id;
  if (id) return id.toString();
  return req.ip || "unknown";
};

export const loginIpLimiter = build({
  tier: "loginIp",
  store: "mongo",
  config: config.rateLimit.tiers.loginIp,
  getKey: byIp,
});

export const loginEmailLimiter = build({
  tier: "loginEmail",
  store: "mongo",
  config: config.rateLimit.tiers.loginEmail,
  getKey: byEmailLowercased,
});

export const passwordResetLimiter = build({
  tier: "passwordReset",
  store: "mongo",
  config: config.rateLimit.tiers.passwordReset,
  getKey: byIp,
});

export const registerLimiter = build({
  tier: "register",
  store: "mongo",
  config: config.rateLimit.tiers.register,
  getKey: byIp,
});

export const resendEmailLimiter = build({
  tier: "resendEmail",
  store: "mongo",
  config: config.rateLimit.tiers.resendEmail,
  getKey: byIp,
});

export const activationLimiter = build({
  tier: "activation",
  store: "mongo",
  config: config.rateLimit.tiers.activation,
  getKey: byIp,
});

export const publicLimiter = build({
  tier: "public",
  store: "memory",
  config: config.rateLimit.tiers.public,
  getKey: byIp,
});

// Dashboards publics (plusieurs XHR/page, IP NAT partagée)
export const publicDashboardLimiter = build({
  tier: "publicDashboard",
  store: "memory",
  config: config.rateLimit.tiers.publicDashboard,
  getKey: byIp,
});

export const apiLimiter = build({
  tier: "api",
  store: "memory",
  config: config.rateLimit.tiers.api,
  getKey: byUserId,
});

export const heavyLimiter = build({
  tier: "heavy",
  store: "memory",
  config: config.rateLimit.tiers.heavy,
  getKey: byUserId,
});

export const webhookLimiter = build({
  tier: "webhook",
  store: "memory",
  config: config.rateLimit.tiers.webhook,
  getKey: byIp,
});

/** Test-only : vide le cache de limiteurs pour repartir d'un compteur neuf. */
export function _resetLimitersForTests(): void {
  limiterCache.clear();
}

/** Reset les compteurs login (IP + email) après un succès, pour éviter le ratchet après recovery. */
export async function clearLoginCounters(email: string, ip: string | undefined): Promise<void> {
  const tasks: Promise<unknown>[] = [];
  const emailKey = email.trim().toLowerCase();
  const emailLimiter = limiterCache.get("loginEmail");
  if (emailLimiter && emailKey) tasks.push(emailLimiter.delete(emailKey).catch(() => undefined));
  const ipLimiter = limiterCache.get("loginIp");
  if (ipLimiter && ip) tasks.push(ipLimiter.delete(ip).catch(() => undefined));
  await Promise.all(tasks);
}
