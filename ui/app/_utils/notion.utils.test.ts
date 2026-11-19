import { describe, expect, it } from "vitest";

import { isNotionPageId } from "./notion.utils";

describe("isNotionPageId", () => {
  it("accepte un identifiant de 32 caractères, avec ou sans tirets", () => {
    expect(isNotionPageId("dbb1eddc954441eaa0ba7f5c6404bdc0")).toBe(true);
    expect(isNotionPageId("dbb1eddc-9544-41ea-a0ba-7f5c6404bdc0")).toBe(true);
  });

  it("accepte un identifiant précédé d'un titre ou suivi d'une requête", () => {
    expect(isNotionPageId("Page-d-Aide-FAQ-dbb1eddc954441eaa0ba7f5c6404bdc0")).toBe(true);
    expect(isNotionPageId("dbb1eddc954441eaa0ba7f5c6404bdc0?pvs=4")).toBe(true);
  });

  it("refuse les chemins sondés par les scanners", () => {
    for (const id of [".env", "%252eenv", "config.yaml", "phpinfo.php", "swagger-ui-init.js", "api", "dbb1eddc"]) {
      expect(isNotionPageId(id)).toBe(false);
    }
  });
});
