import * as Boom from "@hapi/boom";
import type { NextFunction, Request, Response } from "express";

// zod 3 crée une erreur par élément invalide d'un tableau, sans plafond (GHSA-mrhx-c7xc-m3w5), et `.max()`
// n'interrompt pas ce parcours : le plafond doit donc s'appliquer avant toute validation.
export const MAX_BODY_ARRAY_ITEMS = 50_000;

export function countArrayItems(root: unknown, limit: number): number {
  let count = 0;
  const pile: unknown[] = [root];

  while (pile.length > 0) {
    const node = pile.pop();
    if (node === null || typeof node !== "object") continue;

    const children = Array.isArray(node) ? node : Object.values(node);
    if (Array.isArray(node)) {
      count += node.length;
      if (count > limit) return count;
    }
    for (const child of children) {
      if (child !== null && typeof child === "object") pile.push(child);
    }
  }

  return count;
}

export default (limit: number = MAX_BODY_ARRAY_ITEMS) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (countArrayItems(req.body, limit) > limit) {
      return next(Boom.entityTooLarge(`Le corps de la requête contient plus de ${limit} éléments de tableau`));
    }
    next();
  };
