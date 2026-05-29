import { strict as assert } from "assert";

import { AxiosInstance } from "axiosist";
import { ObjectId } from "mongodb";
import { RateLimiterMongo } from "rate-limiter-flexible";
import { afterEach, beforeEach, describe, it, vi } from "vitest";

import { usersMigrationDb } from "@/common/model/collections";
import { hash } from "@/common/utils/passwordUtils";
import config from "@/config";
import { _resetLimitersForTests, isPrivateIp } from "@/http/middlewares/rateLimit";
import { useMongo } from "@tests/jest/setupMongo";
import { initTestApp } from "@tests/utils/testUtils";

let httpClient: AxiosInstance;

const TEST_PASSWORD = "MDP-azerty123";
const TEST_PASSWORD_HASH = hash(TEST_PASSWORD);

async function createConfirmedUser(email: string) {
  await usersMigrationDb().insertOne({
    _id: new ObjectId(),
    account_status: "CONFIRMED",
    password_updated_at: new Date(),
    connection_history: [],
    emails: [],
    created_at: new Date(),
    civility: "Madame",
    nom: "Test",
    prenom: "User",
    fonction: "QA",
    email,
    telephone: "",
    password: TEST_PASSWORD_HASH,
    has_accept_cgu_version: "v0.1",
    organisation_id: new ObjectId(),
  });
}

describe("Rate limiting", () => {
  useMongo();

  beforeEach(async () => {
    // Vide le cache de limiteurs mémoire (les tiers Mongo sont reset par clearAllCollections()).
    _resetLimitersForTests();
    const app = await initTestApp();
    httpClient = app.httpClient;
    config.rateLimit.tiers.loginIp.enforce = true;
    config.rateLimit.tiers.loginEmail.enforce = true;
    config.rateLimit.tiers.webhook.enforce = false;
  });

  describe("isPrivateIp helper", () => {
    it("identifies RFC1918 and loopback ranges", () => {
      assert.strictEqual(isPrivateIp("10.0.0.1"), true);
      assert.strictEqual(isPrivateIp("172.20.0.5"), true);
      assert.strictEqual(isPrivateIp("192.168.1.1"), true);
      assert.strictEqual(isPrivateIp("127.0.0.1"), true);
      assert.strictEqual(isPrivateIp("::1"), true);
      assert.strictEqual(isPrivateIp("::ffff:10.0.0.1"), true);
      assert.strictEqual(isPrivateIp("8.8.8.8"), false);
      assert.strictEqual(isPrivateIp(undefined), false);
    });
  });

  describe("login", () => {
    it("returns 429 once the per-IP budget is exhausted", async () => {
      const email = "ratelimit-1@test.fr";
      await createConfirmedUser(email);
      const limit = config.rateLimit.tiers.loginIp.points;

      for (let i = 0; i < limit; i++) {
        const r = await httpClient.post("/api/v1/auth/login", { email, password: "wrong" });
        assert.strictEqual(r.status, 401, `attempt #${i + 1}: expected 401, got ${r.status}`);
      }

      const blocked = await httpClient.post("/api/v1/auth/login", { email, password: "wrong" });
      assert.strictEqual(blocked.status, 429);
      assert.ok(blocked.headers["retry-after"], "Retry-After header missing");
      assert.strictEqual(blocked.headers["ratelimit-remaining"], "0");
    });

    it("a successful login clears the email and IP counters (no ratchet after recovery)", async () => {
      const email = "ratelimit-clear@test.fr";
      await createConfirmedUser(email);

      // 3 échecs puis 1 succès → le compteur doit retomber à 0
      for (let i = 0; i < 3; i++) {
        const r = await httpClient.post("/api/v1/auth/login", { email, password: "wrong" });
        assert.strictEqual(r.status, 401);
      }
      const ok = await httpClient.post("/api/v1/auth/login", { email, password: TEST_PASSWORD });
      assert.strictEqual(ok.status, 200);

      // Après reset : 5 nouveaux échecs restent en 401 (pas 429)
      for (let i = 0; i < 5; i++) {
        const r = await httpClient.post("/api/v1/auth/login", { email, password: "wrong" });
        assert.strictEqual(r.status, 401, `post-clear attempt #${i + 1}: expected 401, got ${r.status}`);
      }
    });

    it("the IP counter bites regardless of the email (distinct emails, same IP)", async () => {
      const limit = config.rateLimit.tiers.loginIp.points;
      const emails = Array.from({ length: limit + 1 }, (_, i) => `ratelimit-ip-${i}@test.fr`);
      for (const email of emails) await createConfirmedUser(email);

      for (let i = 0; i < limit; i++) {
        const r = await httpClient.post("/api/v1/auth/login", { email: emails[i], password: "wrong" });
        assert.strictEqual(r.status, 401, `attempt #${i + 1}: expected 401, got ${r.status}`);
      }

      const blocked = await httpClient.post("/api/v1/auth/login", { email: emails[limit], password: "wrong" });
      assert.strictEqual(blocked.status, 429, "request past the per-IP budget should block even on a fresh email");
    });

    it("sets the IETF RateLimit headers and a Boom-shaped body on the 429", async () => {
      const email = "ratelimit-headers@test.fr";
      await createConfirmedUser(email);
      const { points, duration } = config.rateLimit.tiers.loginIp;

      for (let i = 0; i < points; i++) {
        await httpClient.post("/api/v1/auth/login", { email, password: "wrong" });
      }
      const blocked = await httpClient.post("/api/v1/auth/login", { email, password: "wrong" });

      assert.strictEqual(blocked.status, 429);
      assert.strictEqual(blocked.headers["ratelimit-limit"], String(points));
      assert.strictEqual(blocked.headers["ratelimit-policy"], `${points};w=${duration}`);
      assert.ok(blocked.headers["ratelimit-reset"], "RateLimit-Reset header missing");
      assert.ok(blocked.headers["retry-after"], "Retry-After header missing");
      assert.strictEqual(blocked.data.error, "Too Many Requests");
      assert.strictEqual(blocked.data.message, "Trop de requêtes, veuillez réessayer plus tard.");
    });
  });

  describe("loginEmail tier (IP-agnostic)", () => {
    beforeEach(async () => {
      config.trustProxy = 1;
      _resetLimitersForTests();
      const app = await initTestApp();
      httpClient = app.httpClient;
    });
    afterEach(() => {
      config.trustProxy = 0;
    });

    it("returns 429 on the 21st attempt on the same email, even from distinct IPs", async () => {
      const email = "ratelimit-email-mou@test.fr";
      await createConfirmedUser(email);

      for (let i = 0; i < 20; i++) {
        const r = await httpClient.post(
          "/api/v1/auth/login",
          { email, password: "wrong" },
          { headers: { "X-Forwarded-For": `203.0.113.${i + 1}` } }
        );
        assert.strictEqual(r.status, 401, `attempt #${i + 1}: expected 401, got ${r.status}`);
      }

      const blocked = await httpClient.post(
        "/api/v1/auth/login",
        { email, password: "wrong" },
        { headers: { "X-Forwarded-For": "203.0.113.99" } }
      );
      assert.strictEqual(blocked.status, 429);
    });

    it("a lockout on emailA does not affect emailB from a fresh IP", async () => {
      const emailA = "ratelimit-cross-a@test.fr";
      const emailB = "ratelimit-cross-b@test.fr";
      await createConfirmedUser(emailA);
      await createConfirmedUser(emailB);

      for (let i = 0; i < 20; i++) {
        await httpClient.post(
          "/api/v1/auth/login",
          { email: emailA, password: "wrong" },
          { headers: { "X-Forwarded-For": `198.51.100.${i + 1}` } }
        );
      }
      const blockedA = await httpClient.post(
        "/api/v1/auth/login",
        { email: emailA, password: "wrong" },
        { headers: { "X-Forwarded-For": "198.51.100.100" } }
      );
      assert.strictEqual(blockedA.status, 429, "emailA should be locked");

      const okB = await httpClient.post(
        "/api/v1/auth/login",
        { email: emailB, password: TEST_PASSWORD },
        { headers: { "X-Forwarded-For": "198.51.100.200" } }
      );
      assert.strictEqual(okB.status, 200, "emailB from a fresh IP should not be impacted");
    });
  });

  describe("skip rules", () => {
    it("never rate-limits the healthcheck even under sustained load", async () => {
      for (let i = 0; i < 50; i++) {
        const r = await httpClient.get("/api");
        assert.strictEqual(r.status, 200);
      }
    });

    it("never rate-limits loopback when skipPrivateIps is on, even past the loginIp budget", async () => {
      const previous = config.rateLimit.skipPrivateIps;
      config.rateLimit.skipPrivateIps = true;
      try {
        const email = "ratelimit-loopback@test.fr";
        await createConfirmedUser(email);
        for (let i = 0; i < config.rateLimit.tiers.loginIp.points + 10; i++) {
          const r = await httpClient.post("/api/v1/auth/login", { email, password: "wrong" });
          assert.strictEqual(r.status, 401, `attempt #${i + 1}: expected 401, got ${r.status}`);
        }
      } finally {
        config.rateLimit.skipPrivateIps = previous;
      }
    }, 30_000);
  });

  describe("publicDashboard tier (separate budget from public)", () => {
    const DASHBOARD_IP = { headers: { "X-Forwarded-For": "203.0.113.50" } };

    beforeEach(() => {
      config.trustProxy = 1;
      config.rateLimit.tiers.publicDashboard.enforce = true;
    });
    afterEach(() => {
      config.trustProxy = 0;
      config.rateLimit.tiers.publicDashboard.points = 600;
      config.rateLimit.tiers.public.points = 300;
    });

    it("returns 429 on a dashboard route once its own budget is exhausted", async () => {
      config.rateLimit.tiers.publicDashboard.points = 2;
      _resetLimitersForTests();
      const { httpClient: client } = await initTestApp();

      for (let i = 0; i < 2; i++) {
        const r = await client.get("/api/v1/reseaux", DASHBOARD_IP);
        assert.notStrictEqual(r.status, 429, `attempt #${i + 1} should be under budget`);
      }
      const blocked = await client.get("/api/v1/reseaux", DASHBOARD_IP);
      assert.strictEqual(blocked.status, 429, "3rd dashboard call should exceed the publicDashboard budget");
    });

    it("does not share its counter with the public tier", async () => {
      config.rateLimit.tiers.publicDashboard.points = 1;
      config.rateLimit.tiers.public.points = 50;
      config.rateLimit.tiers.public.enforce = true;
      _resetLimitersForTests();
      const { httpClient: client } = await initTestApp();

      await client.get("/api/v1/reseaux", DASHBOARD_IP);
      const blockedDashboard = await client.get("/api/v1/reseaux", DASHBOARD_IP);
      assert.strictEqual(blockedDashboard.status, 429, "publicDashboard should be exhausted");
      const publicRoute = await client.post("/api/v1/organismes/search-by-siret", { siret: "x" }, DASHBOARD_IP);
      assert.notStrictEqual(publicRoute.status, 429, "public tier must not be impacted by publicDashboard exhaustion");
    });
  });

  describe("shadow mode", () => {
    it("does not return 429 when the webhook tier is in shadow mode", async () => {
      for (let i = 0; i < 30; i++) {
        const r = await httpClient.post("/api/webhooks/brevo/whatsapp", {});
        assert.notStrictEqual(r.status, 429, `unexpected 429 in shadow mode on attempt #${i + 1}`);
      }
    });

    it("does not emit exhaustion headers once over budget in shadow mode", async () => {
      const previousPoints = config.rateLimit.tiers.webhook.points;
      config.rateLimit.tiers.webhook.points = 2;
      config.rateLimit.tiers.webhook.enforce = false;
      _resetLimitersForTests();
      const app = await initTestApp();
      const client = app.httpClient;
      try {
        const underBudget = await client.post("/api/webhooks/brevo/whatsapp", {});
        assert.notStrictEqual(underBudget.status, 429);
        assert.ok(underBudget.headers["ratelimit-remaining"], "expected RateLimit-Remaining on the allowed path");

        await client.post("/api/webhooks/brevo/whatsapp", {});
        const overBudget = await client.post("/api/webhooks/brevo/whatsapp", {});
        assert.notStrictEqual(overBudget.status, 429, "shadow mode must not block");
        assert.strictEqual(overBudget.headers["retry-after"], undefined, "no Retry-After in shadow mode");
        assert.notStrictEqual(overBudget.headers["ratelimit-remaining"], "0", "shadow mode must not signal exhaustion");
      } finally {
        config.rateLimit.tiers.webhook.points = previousPoints;
      }
    });
  });

  describe("resilience", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("fails open (lets the request through) when the limiter store errors unexpectedly", async () => {
      const email = "ratelimit-failopen@test.fr";
      await createConfirmedUser(email);

      vi.spyOn(RateLimiterMongo.prototype, "consume").mockRejectedValue(new Error("mongo down"));

      for (let i = 0; i < 8; i++) {
        const r = await httpClient.post("/api/v1/auth/login", { email, password: "wrong" });
        assert.strictEqual(r.status, 401, `attempt #${i + 1}: expected fail-open 401, got ${r.status}`);
      }
    });
  });
});
