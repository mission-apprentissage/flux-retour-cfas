import { describe, expect, it } from "vitest";

import { creerSuiviPages } from "./hydrate-deca-raw";

describe("creerSuiviPages", () => {
  it("reprend au curseur de départ tant qu'aucune page n'est lue", () => {
    expect(creerSuiviPages(undefined).reprise()).toBeUndefined();
    expect(creerSuiviPages("abc").reprise()).toBe("abc");
  });

  it("reprend au début tant que la première page n'est pas finie, même quand une autre est lue", () => {
    const suivi = creerSuiviPages(undefined);
    const premiere = suivi.ouvrir(undefined, 2);
    suivi.ouvrir("b", 1);

    suivi.terminer(premiere);

    expect(suivi.reprise()).toBeUndefined();
  });

  it("reprend à la plus ancienne page encore en cours, puis à la dernière lue", () => {
    const suivi = creerSuiviPages("a");
    const pageA = suivi.ouvrir("a", 1);
    const pageB = suivi.ouvrir("b", 1);

    suivi.terminer(pageA);
    expect(suivi.reprise()).toBe("b");

    suivi.terminer(pageB);
    expect(suivi.reprise()).toBe("b");
  });

  it("ignore une page vide", () => {
    const suivi = creerSuiviPages("a");
    suivi.ouvrir("a", 0);
    const pageB = suivi.ouvrir("b", 1);

    expect(suivi.reprise()).toBe("b");
    suivi.terminer(pageB);
    expect(suivi.pages).toBe(2);
  });
});
