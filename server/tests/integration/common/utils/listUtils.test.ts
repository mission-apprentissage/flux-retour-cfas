import { describe, it, expect } from "vitest";

import { formatListeAvecReste, formatListeTronquee } from "@/common/utils/listUtils";

describe("formatListeAvecReste", () => {
  it("joint les éléments quand il n'y a pas de reste", () => {
    expect(formatListeAvecReste([], 0)).toBe("");
    expect(formatListeAvecReste(["ML A"], 0)).toBe("ML A");
    expect(formatListeAvecReste(["ML A", "ML B"], 0)).toBe("ML A, ML B");
  });

  it("résume le reste et accorde « autre »", () => {
    expect(formatListeAvecReste(["ML A", "ML B"], 1)).toBe("ML A, ML B et 1 autre");
    expect(formatListeAvecReste(["ML A", "ML B"], 4)).toBe("ML A, ML B et 4 autres");
  });

  it("ne renvoie rien quand aucun élément n'est nommé, même s'il reste des éléments", () => {
    expect(formatListeAvecReste([], 3)).toBe("");
    expect(formatListeAvecReste(["", ""], 3)).toBe("");
  });
});

describe("formatListeTronquee", () => {
  it("ne tronque pas en deçà de la limite", () => {
    expect(formatListeTronquee([])).toBe("");
    expect(formatListeTronquee(["ML A"])).toBe("ML A");
    expect(formatListeTronquee(["ML A", "ML B"])).toBe("ML A, ML B");
  });

  it("tronque au-delà de la limite", () => {
    expect(formatListeTronquee(["ML A", "ML B", "ML C"])).toBe("ML A, ML B et 1 autre");
    expect(formatListeTronquee(["ML A", "ML B", "ML C", "ML D", "ML E", "ML F"])).toBe("ML A, ML B et 4 autres");
  });

  it("ignore les entrées vides avant de découper, pour ne pas gaspiller une place", () => {
    expect(formatListeTronquee(["ML A", "", "ML B"])).toBe("ML A, ML B");
    expect(formatListeTronquee(["", "ML A", "ML B", "ML C"])).toBe("ML A, ML B et 1 autre");
  });

  it("respecte une limite explicite", () => {
    expect(formatListeTronquee(["ML A", "ML B", "ML C"], 1)).toBe("ML A et 2 autres");
  });
});
