import { afterEach, describe, expect, it, vi } from "vitest";

import { cachedInRun, getRunCacheStats, withRunCache } from "./runCache";
import { traiterEnParallele } from "./traiterEnParallele";

const attendre = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("traiterEnParallele", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("traite tous les éléments sans dépasser la concurrence", async () => {
    let enCours = 0;
    let maximum = 0;
    const traites: number[] = [];

    await traiterEnParallele([1, 2, 3, 4, 5, 6, 7], {
      concurrence: 3,
      traiter: async (element) => {
        enCours++;
        maximum = Math.max(maximum, enCours);
        await attendre(5);
        traites.push(element);
        enCours--;
      },
      surErreur: () => {},
    });

    expect(traites.sort()).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(maximum).toBe(3);
  });

  it("ne laisse pas un élément lent bloquer les suivants", async () => {
    const ordre: string[] = [];

    await traiterEnParallele(["lent", "a", "b", "c"], {
      concurrence: 2,
      traiter: async (element) => {
        await attendre(element === "lent" ? 50 : 5);
        ordre.push(element);
      },
      surErreur: () => {},
    });

    expect(ordre).toEqual(["a", "b", "c", "lent"]);
  });

  it("remonte une erreur de traitement sans arrêter la file ni rejet non géré", async () => {
    const rejetsNonGeres: unknown[] = [];
    const ecouteur = (raison: unknown) => rejetsNonGeres.push(raison);
    process.on("unhandledRejection", ecouteur);
    const erreurs: Array<[unknown, number]> = [];
    const traites: number[] = [];

    try {
      await traiterEnParallele([1, 2, 3, 4], {
        concurrence: 2,
        traiter: async (element) => {
          if (element === 2) throw new Error("échec 2");
          traites.push(element);
        },
        surErreur: (erreur, element) => erreurs.push([erreur, element]),
      });
      await attendre(10);
    } finally {
      process.off("unhandledRejection", ecouteur);
    }

    expect(traites).toEqual([1, 3, 4]);
    expect(erreurs).toHaveLength(1);
    expect(erreurs[0][1]).toBe(2);
    expect(rejetsNonGeres).toEqual([]);
  });

  it("attend les traitements en cours avant de lever une erreur de la source", async () => {
    const termines: number[] = [];

    async function* source() {
      yield 1;
      yield 2;
      throw new Error("source coupée");
    }

    await expect(
      traiterEnParallele(source(), {
        concurrence: 5,
        traiter: async (element) => {
          await attendre(20);
          termines.push(element);
        },
        surErreur: () => {},
      })
    ).rejects.toThrow("source coupée");

    expect(termines.sort()).toEqual([1, 2]);
  });

  it("garde le cache du run dans les traitements", async () => {
    const load = vi.fn().mockResolvedValue("valeur");

    const stats = await withRunCache(async () => {
      await traiterEnParallele([1, 2, 3], {
        concurrence: 1,
        traiter: async () => {
          await cachedInRun("cle:a", load);
        },
        surErreur: () => {},
      });
      return getRunCacheStats();
    });

    expect(load).toHaveBeenCalledTimes(1);
    expect(stats?.cle).toMatchObject({ acces: 3, defauts: 1 });
  });
});
