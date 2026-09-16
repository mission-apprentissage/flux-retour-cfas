import { describe, expect, it } from "vitest";

import {
  CFA_COLLAB_AUTO_SEND_DELAI_DAYS,
  CFA_COLLAB_INACTIVITE_RELANCE_DAYS,
  CFA_COLLAB_INACTIVITE_SUSPENSION_DAYS,
} from "./collaboration";

describe("constantes de collaboration CFA / Mission Locale", () => {
  it("fixe le délai de transmission automatique à 45 jours", () => {
    expect(CFA_COLLAB_AUTO_SEND_DELAI_DAYS).toBe(45);
  });

  it("fixe la relance d'inactivité à 30 jours et la suspension 5 jours plus tard", () => {
    expect(CFA_COLLAB_INACTIVITE_RELANCE_DAYS).toBe(30);
    expect(CFA_COLLAB_INACTIVITE_SUSPENSION_DAYS).toBe(5);
  });
});
