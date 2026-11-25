import { describe, expect, it } from "vitest";

import { creerOrdreParCle } from "./hydrate-deca-raw";

const attendre = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("creerOrdreParCle", () => {
  it("exécute dans l'ordre d'arrivée les traitements d'une même clé, en parallèle les autres", async () => {
    const dansLOrdre = creerOrdreParCle();
    const ordre: string[] = [];

    await Promise.all([
      dansLOrdre("a", async () => {
        await attendre(30);
        ordre.push("a1");
      }),
      dansLOrdre("b", async () => {
        ordre.push("b1");
      }),
      dansLOrdre("a", async () => {
        ordre.push("a2");
      }),
    ]);

    expect(ordre).toEqual(["b1", "a1", "a2"]);
  });

  it("passe au suivant d'une clé après un échec, et remonte l'échec à son appelant", async () => {
    const dansLOrdre = creerOrdreParCle();
    const ordre: string[] = [];

    const premier = dansLOrdre("a", async () => {
      throw new Error("échec a1");
    });
    const second = dansLOrdre("a", async () => {
      ordre.push("a2");
    });

    await expect(premier).rejects.toThrow("échec a1");
    await second;
    expect(ordre).toEqual(["a2"]);
  });
});
