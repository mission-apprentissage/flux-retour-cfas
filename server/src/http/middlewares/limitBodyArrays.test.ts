import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import limitBodyArrays, { countArrayItems, MAX_BODY_ARRAY_ITEMS } from "./limitBodyArrays";

const run = (body: unknown, limit?: number) => {
  const next = vi.fn() as unknown as NextFunction & ReturnType<typeof vi.fn>;
  limitBodyArrays(limit)({ body } as Request, {} as Response, next);
  return next;
};

describe("countArrayItems", () => {
  it("compte les éléments de tous les tableaux imbriqués", () => {
    expect(countArrayItems({ a: [1, 2, 3], b: { c: [[1, 2], [3]] } }, 100)).toBe(3 + 2 + 2 + 1);
  });

  it("ignore les corps sans tableau", () => {
    expect(countArrayItems(undefined, 100)).toBe(0);
    expect(countArrayItems(null, 100)).toBe(0);
    expect(countArrayItems("texte", 100)).toBe(0);
    expect(countArrayItems({ a: 1, b: { c: "x" } }, 100)).toBe(0);
  });

  it("s'arrête dès que la limite est dépassée", () => {
    expect(countArrayItems({ a: [1, 2, 3, 4, 5], b: [6, 7, 8, 9] }, 4)).toBeGreaterThan(4);
  });

  it("supporte un tableau de plusieurs millions d'éléments sans dépasser la pile", () => {
    expect(countArrayItems(new Array(5_000_000).fill(1), 10)).toBe(5_000_000);
  });

  it("supporte une imbrication très profonde sans récursion", () => {
    let profond: unknown[] = [];
    for (let i = 0; i < 100_000; i++) profond = [profond];
    expect(countArrayItems(profond, 1_000_000)).toBe(100_000);
  });
});

describe("limitBodyArrays", () => {
  it("laisse passer un corps sous la limite", () => {
    const next = run({ ids: new Array(MAX_BODY_ARRAY_ITEMS).fill("a") });
    expect(next).toHaveBeenCalledWith();
  });

  it("laisse passer une requête sans corps", () => {
    expect(run(undefined)).toHaveBeenCalledWith();
  });

  it("refuse en 413 un corps qui dépasse la limite", () => {
    const next = run({ ids: new Array(MAX_BODY_ARRAY_ITEMS + 1).fill(1) });
    const erreur = next.mock.calls[0][0];
    expect(erreur.output.statusCode).toBe(413);
    expect(erreur.message).toContain(String(MAX_BODY_ARRAY_ITEMS));
  });

  it("additionne les tableaux d'un même corps", () => {
    const next = run({ a: [1, 2], b: [3, 4] }, 3);
    expect(next.mock.calls[0][0].output.statusCode).toBe(413);
  });
});
