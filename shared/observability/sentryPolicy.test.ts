import { describe, expect, it } from "vitest";

import { BROWSER_DROP_REASONS, NEXT_DROP_REASONS } from "./sentryNoise";
import {
  buildBeforeSend,
  classifyDrop,
  enforceTagPolicy,
  normalizeForGrouping,
  scrubPii,
  type SentryEventLike,
} from "./sentryPolicy";

const UI_DROP_REASONS = [...BROWSER_DROP_REASONS, ...NEXT_DROP_REASONS];

const withException = (type: string, value: string, extra: Partial<SentryEventLike> = {}): SentryEventLike => ({
  exception: { values: [{ type, value }] },
  ...extra,
});

describe("normalizeForGrouping", () => {
  it("neutralise les identifiants et les dates", () => {
    expect(normalizeForGrouping("effectif 64f0a1b2c3d4e5f6a7b8c9d0 invalide")).toBe("effectif <id> invalide");
    expect(normalizeForGrouping("job 3fa85f64-5717-4562-b3fc-2c963f66afa6 KO")).toBe("job <uuid> KO");
    expect(normalizeForGrouping("échec au 2026-09-23T10:00:00Z")).toBe("échec au <date>");
    expect(normalizeForGrouping("timeout après 30000 ms")).toBe("timeout après <n> ms");
  });

  it("regroupe deux messages qui ne diffèrent que par leurs valeurs", () => {
    expect(normalizeForGrouping("12 échecs sur 1000")).toBe(normalizeForGrouping("37 échecs sur 1000"));
  });
});

describe("classifyDrop", () => {
  it("rejette les 401/403 attendus du front", () => {
    expect(classifyDrop(withException("AuthError", "Request rejected with status code 401"), UI_DROP_REASONS)).toBe(
      "expected-auth"
    );
  });

  it("rejette les échecs de chargement de chunk", () => {
    expect(classifyDrop(withException("ChunkLoadError", "Loading chunk 4821 failed"), UI_DROP_REASONS)).toBe(
      "chunk-load"
    );
    expect(
      classifyDrop(withException("TypeError", "Failed to fetch dynamically imported module: /x.js"), UI_DROP_REASONS)
    ).toBe("chunk-load");
  });

  it("rejette le contrôle de flux de Next", () => {
    expect(classifyDrop(withException("Error", "NEXT_REDIRECT"), UI_DROP_REASONS)).toBe("next-control-flow");
  });

  it("conserve une vraie erreur serveur", () => {
    expect(classifyDrop(withException("TypeError", "Cannot read properties of undefined"), UI_DROP_REASONS)).toBeNull();
  });

  it("ne rejette pas une phrase contenant « cancelled »", () => {
    expect(classifyDrop(withException("Error", "Job cancelled by the operator"), UI_DROP_REASONS)).toBeNull();
  });

  // Côté serveur, ce message désigne une panne d'API amont, pas un onglet fermé.
  it("conserve « Failed to fetch » pour un runtime sans catégorie navigateur", () => {
    const event = withException("TypeError", "Failed to fetch");

    expect(classifyDrop(event, UI_DROP_REASONS)).toBe("network");
    expect(classifyDrop(event, [])).toBeNull();
  });

  it("rejette une pile entièrement issue d'une extension", () => {
    const event: SentryEventLike = {
      exception: {
        values: [
          {
            type: "TypeError",
            value: "boom",
            stacktrace: {
              frames: [
                { filename: "chrome-extension://abcd/content.js", in_app: true },
                { filename: "moz-extension://efgh/inject.js", in_app: true },
              ],
            },
          },
        ],
      },
    };

    expect(classifyDrop(event, UI_DROP_REASONS)).toBe("browser-extension");
  });

  it("conserve une pile applicative qui contient une frame d'extension", () => {
    const event: SentryEventLike = {
      exception: {
        values: [
          {
            type: "TypeError",
            value: "boom",
            stacktrace: {
              frames: [
                { filename: "chrome-extension://abcd/content.js", in_app: true },
                { filename: "/app/ui/components/Table.tsx", in_app: true },
              ],
            },
          },
        ],
      },
    };

    expect(classifyDrop(event, UI_DROP_REASONS)).toBeNull();
  });
});

describe("scrubPii", () => {
  it("retire l'IP, y compris sous la clé invalide", () => {
    const event = scrubPii({ user: { id: "42", ip_address: "1.2.3.4", ip: "1.2.3.4", segment: "jwt-2" } });

    expect(event.user).toEqual({ id: "42", segment: "jwt-2" });
  });

  it("masque les e-mails dans l'utilisateur, les extra et le message", () => {
    const event = scrubPii({
      user: { username: "jean.dupont@example.com" },
      extra: { destinataires: ["marie.martin@cfa.fr"] },
      message: "envoi à jean.dupont@example.com échoué",
    });

    expect(event.user?.username).toBe("jea*******t@example.com");
    expect(event.extra?.destinataires).toEqual(["mar*******n@cfa.fr"]);
    expect(event.message).toBe("envoi à jea*******t@example.com échoué");
  });

  it("masque les e-mails portés par le message d'exception", () => {
    const event = scrubPii(withException("Error", "contact inconnu : a.b.contact@cfa.fr"));

    expect(event.exception?.values?.[0].value).toBe("contact inconnu : a.b*******t@cfa.fr");
  });

  it("retire les en-têtes porteurs de secrets", () => {
    const event = scrubPii({
      request: { headers: { Authorization: "Bearer xyz", Cookie: "a=b", "Content-Type": "application/json" } },
    });

    expect(event.request?.headers).toEqual({ "Content-Type": "application/json" });
  });

  it("supporte une structure cyclique", () => {
    const extra: Record<string, unknown> = { nom: "a@b.fr" };
    extra.self = extra;

    expect(() => scrubPii({ extra })).not.toThrow();
    expect(extra.nom).toBe("*@b.fr");
  });
});

describe("enforceTagPolicy", () => {
  it("pose « veille » quand aucun niveau n'est déclaré", () => {
    const event: SentryEventLike = {};

    expect(enforceTagPolicy(event).tags?.alert_tier).toBe("veille");
  });

  it("conserve un niveau explicite", () => {
    expect(enforceTagPolicy({ tags: { alert_tier: "oncall" } }).tags?.alert_tier).toBe("oncall");
  });

  it("remplace un niveau inconnu par le défaut", () => {
    expect(enforceTagPolicy({ tags: { alert_tier: "urgent" } }).tags?.alert_tier).toBe("veille");
  });

  it("bascule un tag hors allowlist en extra", () => {
    const input: SentryEventLike = { tags: { organisme_id: "64f0a1b2c3d4e5f6a7b8c9d0", job: "hydrate:daily" } };
    const event = enforceTagPolicy(input);

    expect(event.tags).toEqual({ job: "hydrate:daily", alert_tier: "veille" });
    expect(event.extra).toEqual({ "tag.organisme_id": "64f0a1b2c3d4e5f6a7b8c9d0" });
  });

  it("bascule un tag autorisé mais trop long", () => {
    const input: SentryEventLike = { tags: { route_group: "x".repeat(201) } };
    const event = enforceTagPolicy(input);

    expect(event.tags?.route_group).toBeUndefined();
    expect(event.extra?.["tag.route_group"]).toHaveLength(201);
  });
});

describe("buildBeforeSend", () => {
  it("supprime un événement rejeté", () => {
    expect(
      buildBeforeSend({ dropReasons: UI_DROP_REASONS })(withException("ChunkLoadError", "Loading chunk 1 failed"))
    ).toBeNull();
  });

  it("en mode debug, conserve l'événement et pose drop_reason", () => {
    const event = buildBeforeSend({ dropReasons: UI_DROP_REASONS, debug: true })(
      withException("ChunkLoadError", "Loading chunk 1 failed")
    );

    expect(event?.tags?.drop_reason).toBe("chunk-load");
  });

  it("applique l'enrichissement avant la décision de rejet", () => {
    const beforeSend = buildBeforeSend<SentryEventLike>({
      enrich: (event) => ({ ...event, tags: { ...event.tags, alert_tier: "jour" } }),
    });

    expect(beforeSend(withException("Error", "boom"))?.tags?.alert_tier).toBe("jour");
  });

  it("nettoie et normalise un événement conservé", () => {
    const event = buildBeforeSend()({
      ...withException("Error", "boom"),
      user: { id: "1", ip_address: "1.2.3.4" },
      tags: { siret: "12345678900011" },
    });

    expect(event?.user).toEqual({ id: "1" });
    expect(event?.tags).toEqual({ alert_tier: "veille" });
    expect(event?.extra).toEqual({ "tag.siret": "12345678900011" });
  });
});
