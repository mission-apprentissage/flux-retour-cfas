import { strict as assert } from "assert";

import { AxiosInstance } from "axiosist";
import { ObjectId } from "mongodb";
import { RateLimiterMongo } from "rate-limiter-flexible";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { v4 as uuidv4 } from "uuid";
import { afterEach, beforeEach, describe, it, vi } from "vitest";

import { createSession } from "@/common/actions/sessions.actions";
import { COOKIE_NAME } from "@/common/constants/cookieName";
import { organisationsDb, organismesDb, usersMigrationDb } from "@/common/model/collections";
import { hash } from "@/common/utils/passwordUtils";
import config from "@/config";
import { _resetLimitersForTests, isPrivateIp } from "@/http/middlewares/rateLimit";
import { createRandomOrganisme } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { id, initTestApp } from "@tests/utils/testUtils";

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

    it("never rate-limits loopback on an IP-keyed tier when skipPrivateIps is on, even past the loginIp budget", async () => {
      const previous = config.rateLimit.skipPrivateIps;
      config.rateLimit.skipPrivateIps = true;
      try {
        // Emails distincts pour isoler le tier IP (loginIp) : loginEmail est keyé email et n'est,
        // lui, PAS désactivé par le skip IP privée (cf. build > isIpKeyed), donc on ne veut pas
        // qu'il morde ici. On vérifie uniquement que le budget IP est bien contourné sur loopback.
        const total = config.rateLimit.tiers.loginIp.points + 10;
        const emails = Array.from({ length: total }, (_, i) => `ratelimit-loopback-${i}@test.fr`);
        for (const email of emails) await createConfirmedUser(email);
        for (let i = 0; i < total; i++) {
          const r = await httpClient.post("/api/v1/auth/login", { email: emails[i], password: "wrong" });
          assert.strictEqual(r.status, 401, `attempt #${i + 1}: expected 401, got ${r.status}`);
        }
      } finally {
        config.rateLimit.skipPrivateIps = previous;
      }
    }, 30_000);

    it("still enforces an email-keyed tier on loopback (skipPrivateIps only covers IP-keyed tiers)", async () => {
      const previous = config.rateLimit.skipPrivateIps;
      config.rateLimit.skipPrivateIps = true;
      try {
        // loginIp (IP-keyé) est contourné sur loopback, mais loginEmail (keyé email, 20/h) ne doit
        // PAS l'être : le skip IP privée ne concerne que les tiers keyés IP.
        const email = "ratelimit-loopback-email@test.fr";
        await createConfirmedUser(email);
        for (let i = 0; i < config.rateLimit.tiers.loginEmail.points; i++) {
          const r = await httpClient.post("/api/v1/auth/login", { email, password: "wrong" });
          assert.strictEqual(r.status, 401, `attempt #${i + 1}: expected 401, got ${r.status}`);
        }
        const blocked = await httpClient.post("/api/v1/auth/login", { email, password: "wrong" });
        assert.strictEqual(blocked.status, 429, "email-keyed loginEmail must still bite on loopback");
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

  describe("referentiel tier (/api/organismes, limiter runs before API-key auth)", () => {
    afterEach(() => {
      config.rateLimit.tiers.referentiel.points = 600;
    });

    it("returns 429 once the referentiel budget is exhausted, before reaching auth", async () => {
      config.rateLimit.tiers.referentiel.points = 2;
      _resetLimitersForTests();
      const { httpClient: client } = await initTestApp();

      // Sans clé API : les requêtes sous budget sont rejetées par l'auth (≠ 429),
      // la requête au-delà du budget est bloquée en amont par le limiteur.
      for (let i = 0; i < 2; i++) {
        const r = await client.get("/api/organismes");
        assert.notStrictEqual(r.status, 429, `attempt #${i + 1} should be under budget`);
      }
      const blocked = await client.get("/api/organismes");
      assert.strictEqual(blocked.status, 429, "3rd referentiel call should exceed the budget");
    });
  });

  describe("ingestion tier (/api/v3/dossiers-apprenants, keyed by organisme source)", () => {
    afterEach(() => {
      config.rateLimit.tiers.ingestion.points = 3000;
    });

    it("returns 429 once an organisme exceeds its per-organisme ingestion budget", async () => {
      config.rateLimit.tiers.ingestion.points = 2;
      _resetLimitersForTests();
      const { httpClient: client } = await initTestApp();

      const api_key = uuidv4();
      const org = createRandomOrganisme({ uai: "0802004U", siret: "77937827200016", api_key });
      await organismesDb().insertOne({ ...org, _id: new ObjectId() });
      const headers = { Authorization: `Bearer ${api_key}` };

      for (let i = 0; i < 2; i++) {
        const r = await client.post("/api/v3/dossiers-apprenants", [], { headers });
        assert.notStrictEqual(r.status, 429, `attempt #${i + 1} should be under budget`);
      }
      const blocked = await client.post("/api/v3/dossiers-apprenants", [], { headers });
      assert.strictEqual(blocked.status, 429, "3rd ingestion call should exceed the per-organisme budget");
    });
  });

  describe("ingestionAuth guard (/api/v3/dossiers-apprenants, IP-keyed, before bearer auth)", () => {
    afterEach(() => {
      config.rateLimit.tiers.ingestionAuth.points = 300;
    });

    it("caps a flood of invalid bearer tokens per IP before it reaches the key lookup", async () => {
      config.rateLimit.tiers.ingestionAuth.points = 2;
      _resetLimitersForTests();
      const { httpClient: client } = await initTestApp();
      const headers = { Authorization: "Bearer not-a-real-key" };

      // Tokens invalides : rejetés par l'auth (403), aucun reward → le compteur IP s'accumule.
      for (let i = 0; i < 2; i++) {
        const r = await client.post("/api/v3/dossiers-apprenants", [], { headers });
        assert.notStrictEqual(r.status, 429, `attempt #${i + 1} should be auth-rejected (not 429) under budget`);
      }
      const blocked = await client.post("/api/v3/dossiers-apprenants", [], { headers });
      assert.strictEqual(blocked.status, 429, "3rd invalid-token call should be blocked before reaching auth");
    });

    it("rewards a valid key: successful auth clears the IP counter so legit bulk never trips the guard", async () => {
      config.rateLimit.tiers.ingestionAuth.points = 2;
      _resetLimitersForTests();
      const { httpClient: client } = await initTestApp();

      const api_key = uuidv4();
      const org = createRandomOrganisme({ uai: "0802004U", siret: "77937827200016", api_key });
      await organismesDb().insertOne({ ...org, _id: new ObjectId() });
      const headers = { Authorization: `Bearer ${api_key}` };

      // 4 requêtes valides > budget de 2 : sans reward la 3ᵉ serait 429 ; le reward garde le compteur à zéro.
      for (let i = 0; i < 4; i++) {
        const r = await client.post("/api/v3/dossiers-apprenants", [], { headers });
        assert.notStrictEqual(r.status, 429, `valid attempt #${i + 1} should never hit the ingestionAuth guard`);
      }
    });
  });

  describe("global shadow flag", () => {
    afterEach(() => {
      config.rateLimit.shadow = false;
    });

    it("suppresses 429 across all tiers, even an enforced one, when config.rateLimit.shadow is on", async () => {
      config.rateLimit.shadow = true;
      _resetLimitersForTests();
      const { httpClient: client } = await initTestApp();
      const email = "ratelimit-shadow-global@test.fr";
      await createConfirmedUser(email);

      // loginIp est enforce:true, mais le shadow global doit neutraliser le 429 (reste en 401).
      for (let i = 0; i < config.rateLimit.tiers.loginIp.points + 3; i++) {
        const r = await client.post("/api/v1/auth/login", { email, password: "wrong" });
        assert.strictEqual(r.status, 401, `attempt #${i + 1} should stay 401 (no 429) under global shadow`);
      }
    });
  });

  describe("heavy tier (mongo-backed: exact & persistent across replicas, unlike the memory tiers)", () => {
    const SIRET = "41054102000070";
    const UAI = "0332881D";
    const cfaOrganisationId = new ObjectId(id(1));
    const cfaOrganismeId = new ObjectId(id(2));
    const adminEmail = "ratelimit-heavy-admin@cfa.local";

    afterEach(() => {
      config.rateLimit.tiers.heavy.points = 10;
    });

    async function seedCfaAdminCookie(): Promise<string> {
      await organismesDb().insertOne(
        generateOrganismeFixture({ _id: cfaOrganismeId, siret: SIRET, uai: UAI, nom: "CAMPUS DU LAC" })
      );
      await organisationsDb().insertOne({
        _id: cfaOrganisationId,
        created_at: new Date(),
        type: "ORGANISME_FORMATION",
        siret: SIRET,
        uai: UAI,
        organisme_id: cfaOrganismeId.toString(),
      } as any);
      await usersMigrationDb().insertOne({
        _id: new ObjectId(id(10)),
        account_status: "CONFIRMED",
        created_at: new Date(),
        password_updated_at: new Date(),
        connection_history: [],
        emails: [],
        email: adminEmail,
        nom: "Admin",
        prenom: "Alice",
        fonction: "Directrice",
        password: TEST_PASSWORD_HASH,
        organisation_id: cfaOrganisationId,
        organisation_role: "admin",
        has_accept_cgu_version: "v1",
      } as any);
      const token = await createSession(adminEmail);
      return `${COOKIE_NAME}=${token}`;
    }

    it("enforces exactly and keeps blocking after a limiter-cache reset (mongo persists, memory would not)", async () => {
      config.rateLimit.tiers.heavy.points = 2;
      _resetLimitersForTests();
      const { httpClient: client } = await initTestApp();
      const cookie = await seedCfaAdminCookie();

      // Corps invalide (emails vide → 400) : heavyLimiter est posé AVANT le handler, il consomme
      // quand même. On isole le rate-limit sans créer d'invitations/emails.
      const hit = () => client.post("/api/v1/organisation/membres/batch", { emails: [] }, { headers: { cookie } });

      for (let i = 0; i < 2; i++) {
        const r = await hit();
        assert.notStrictEqual(r.status, 429, `attempt #${i + 1} should be under the heavy budget`);
      }
      const blocked = await hit();
      assert.strictEqual(blocked.status, 429, "3rd heavy call should exceed the budget");

      // Reset du cache de limiteurs (vide les compteurs mémoire) : un tier mémoire repartirait de
      // zéro. heavy est mongo → le compteur persiste dans rateLimits, donc toujours 429.
      _resetLimitersForTests();
      const stillBlocked = await hit();
      assert.strictEqual(
        stillBlocked.status,
        429,
        "heavy is mongo-backed: the counter must survive a limiter-cache reset"
      );
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
