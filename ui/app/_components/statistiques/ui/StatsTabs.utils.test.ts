import { describe, expect, it } from "vitest";

import { resolveTabId } from "./StatsTabs.utils";

const TABS = [
  { id: "ruptures", label: "Suivi ruptures" },
  { id: "collaborations", label: "Suivi collaborations" },
];

describe("resolveTabId", () => {
  it("renvoie l'onglet demandé quand il existe", () => {
    expect(resolveTabId("collaborations", TABS)).toBe("collaborations");
  });

  it("retombe sur le premier onglet sans paramètre ou avec une valeur inconnue", () => {
    expect(resolveTabId(null, TABS)).toBe("ruptures");
    expect(resolveTabId(undefined, TABS)).toBe("ruptures");
    expect(resolveTabId("whatsapp", TABS)).toBe("ruptures");
  });

  it("renvoie une chaîne vide sans onglet", () => {
    expect(resolveTabId("ruptures", [])).toBe("");
  });
});
