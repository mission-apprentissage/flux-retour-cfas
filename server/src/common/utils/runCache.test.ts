import { afterEach, describe, expect, it, vi } from "vitest";

import { cachedInRun, getRunCacheStats, withRunCache } from "./runCache";

describe("cachedInRun", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("appelle toujours le chargeur hors d'un run", async () => {
    const load = vi.fn().mockResolvedValue("valeur");

    await cachedInRun("cle", load);
    await cachedInRun("cle", load);

    expect(load).toHaveBeenCalledTimes(2);
  });

  it("ne charge qu'une fois par clé dans un run", async () => {
    const load = vi.fn().mockResolvedValue("valeur");

    const resultats = await withRunCache(async () => [
      await cachedInRun("cle", load),
      await cachedInRun("cle", load),
      await cachedInRun("autre", load),
    ]);

    expect(resultats).toEqual(["valeur", "valeur", "valeur"]);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("garde le cache à travers les appels concurrents du même run", async () => {
    const load = vi.fn().mockResolvedValue({ id: 1 });

    await withRunCache(async () => {
      await cachedInRun("cle", load);
      await Promise.all([cachedInRun("cle", load), cachedInRun("cle", load)]);
    });

    expect(load).toHaveBeenCalledTimes(1);
  });

  it("ne mémorise pas un résultat null", async () => {
    const load = vi.fn().mockResolvedValue(null);

    await withRunCache(async () => {
      await cachedInRun("cle", load);
      await cachedInRun("cle", load);
    });

    expect(load).toHaveBeenCalledTimes(2);
  });

  it("mémorise un tableau vide", async () => {
    const load = vi.fn().mockResolvedValue([]);

    await withRunCache(async () => {
      await cachedInRun("cle", load);
      await cachedInRun("cle", load);
    });

    expect(load).toHaveBeenCalledTimes(1);
  });

  it("recharge une fois la durée de vie dépassée", async () => {
    vi.useFakeTimers();
    const load = vi.fn().mockResolvedValue("valeur");

    await withRunCache(async () => {
      await cachedInRun("cle", load, { ttlMs: 1_000 });
      vi.advanceTimersByTime(999);
      await cachedInRun("cle", load, { ttlMs: 1_000 });
      vi.advanceTimersByTime(2);
      await cachedInRun("cle", load, { ttlMs: 1_000 });
    });

    expect(load).toHaveBeenCalledTimes(2);
  });

  it("n'expose rien d'un run à l'autre", async () => {
    const load = vi.fn().mockResolvedValue("valeur");

    await withRunCache(() => cachedInRun("cle", load));
    await withRunCache(() => cachedInRun("cle", load));

    expect(load).toHaveBeenCalledTimes(2);
  });
});

describe("getRunCacheStats", () => {
  it("renvoie null hors d'un run", () => {
    expect(getRunCacheStats()).toBeNull();
  });

  it("compte accès et défauts par préfixe de clé", async () => {
    const stats = await withRunCache(async () => {
      await cachedInRun("organisme:a", async () => "A");
      await cachedInRun("organisme:a", async () => "A");
      await cachedInRun("organisme:a", async () => "A");
      await cachedInRun("organisme:b", async () => "B");
      await cachedInRun("opcos-rncp:x", async () => []);
      return getRunCacheStats();
    });

    expect(stats).toEqual({
      organisme: { acces: 4, defauts: 2, tauxDefaut: 0.5 },
      "opcos-rncp": { acces: 1, defauts: 1, tauxDefaut: 1 },
    });
  });

  it("compte comme défaut un résultat null, qui n'est jamais mémorisé", async () => {
    const stats = await withRunCache(async () => {
      await cachedInRun("organisme:inconnu", async () => null);
      await cachedInRun("organisme:inconnu", async () => null);
      return getRunCacheStats();
    });

    expect(stats).toEqual({ organisme: { acces: 2, defauts: 2, tauxDefaut: 1 } });
  });
});
