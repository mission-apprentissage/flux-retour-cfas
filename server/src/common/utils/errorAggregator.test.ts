import { captureException } from "@sentry/node";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createErrorAggregator, normalizeCauseKey } from "./errorAggregator";

const scope = { setTag: vi.fn(), setFingerprint: vi.fn(), setContext: vi.fn() };

vi.mock("@sentry/node", () => ({
  captureException: vi.fn(),
  withScope: vi.fn((cb: (s: typeof scope) => void) => cb(scope)),
}));

beforeEach(() => {
  vi.mocked(captureException).mockClear();
  scope.setFingerprint.mockClear();
  scope.setContext.mockClear();
});

function contextOf(call = 0) {
  return scope.setContext.mock.calls[call][1] as Record<string, unknown>;
}

describe("normalizeCauseKey", () => {
  it.each([
    ["Effectif 64f0a1b2c3d4e5f6a7b8c9d0 introuvable", "Effectif <id> introuvable"],
    ["Échec au 2026-03-14", "Échec au <date>"],
    ["timeout après 3000 ms", "timeout après <n> ms"],
  ])("neutralise %s", (input, expected) => {
    expect(normalizeCauseKey(input)).toBe(expected);
  });

  it("regroupe deux messages ne différant que par un identifiant", () => {
    expect(normalizeCauseKey("organisme 64f0a1b2c3d4e5f6a7b8c9d0 KO")).toBe(
      normalizeCauseKey("organisme 74f0a1b2c3d4e5f6a7b8c9d1 KO")
    );
  });
});

describe("createErrorAggregator", () => {
  it("n'émet rien sans échec", () => {
    const agg = createErrorAggregator("job");
    agg.ok(100);
    agg.flush();
    expect(captureException).not.toHaveBeenCalled();
  });

  it("émet une capture unique pour N échecs de même forme", () => {
    const agg = createErrorAggregator("job");
    for (let i = 0; i < 50; i++) {
      agg.record(new Error(`effectif ${i} invalide`));
    }
    agg.ok(950);
    agg.flush();

    expect(captureException).toHaveBeenCalledOnce();
    const ctx = contextOf();
    expect(ctx.failed).toBe(50);
    expect(ctx.processed).toBe(1000);
    expect(ctx.distinctCauses).toBe(1);
    expect(ctx.topCauses).toEqual([{ key: "Error: effectif <n> invalide", count: 50 }]);
  });

  it("distingue les causes de formes différentes", () => {
    const agg = createErrorAggregator("job");
    agg.record(new Error("mongo indisponible"));
    agg.record(new Error("siret invalide"));
    agg.record(new Error("siret invalide"));
    agg.flush();

    const ctx = contextOf();
    expect(ctx.distinctCauses).toBe(2);
    expect((ctx.topCauses as { count: number }[])[0].count).toBe(2);
  });

  it("garde un fingerprint stable entre deux exécutions à compteurs différents", () => {
    const a = createErrorAggregator("job");
    a.record(new Error("x"));
    a.flush();
    const b = createErrorAggregator("job");
    b.record(new Error("y"));
    b.record(new Error("z"));
    b.flush();

    expect(scope.setFingerprint.mock.calls[0][0]).toEqual(scope.setFingerprint.mock.calls[1][0]);
  });

  it("rattache un échec représentatif comme cause", () => {
    const agg = createErrorAggregator("job");
    const sample = new Error("mongo indisponible");
    agg.record(sample);
    agg.flush();

    expect(vi.mocked(captureException).mock.calls[0][0]).toMatchObject({ cause: sample });
  });

  it("remet les compteurs à zéro après flush", () => {
    const agg = createErrorAggregator("job");
    agg.record(new Error("x"));
    agg.flush();
    expect(agg.failed).toBe(0);
    expect(agg.processed).toBe(0);
  });

  it("finish lève sans capturer au-delà du seuil", () => {
    const agg = createErrorAggregator("job", { failureRateThreshold: 0.5 });
    agg.record(new Error("x"));
    agg.record(new Error("y"));
    agg.ok();

    expect(() => agg.finish()).toThrow("[job]");
    expect(captureException).not.toHaveBeenCalled();
  });

  it("finish capture sans lever en deçà du seuil", () => {
    const agg = createErrorAggregator("job", { failureRateThreshold: 0.5 });
    agg.record(new Error("x"));
    agg.ok(99);

    expect(() => agg.finish()).not.toThrow();
    expect(captureException).toHaveBeenCalledOnce();
  });

  it("accepte une valeur qui n'est pas une Error", () => {
    const agg = createErrorAggregator("job");
    agg.record("cassé");
    agg.flush();
    expect(captureException).toHaveBeenCalledOnce();
  });
});
