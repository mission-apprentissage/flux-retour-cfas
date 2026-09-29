import { describe, expect, it } from "vitest";

import { buildSeedRecetteCrons } from "@/jobs/registry/seed-recette";
import { renderReadme } from "@/jobs/seed-recette/readme";

describe("seed recette", () => {
  it("garde le README des testeurs aligné sur le catalogue", async () => {
    await expect(renderReadme()).toMatchFileSnapshot("../../../src/jobs/seed-recette/README.md");
  });

  it("ne déclare le cron de régénération qu'en recette", () => {
    expect(buildSeedRecetteCrons("recette")).toMatchObject({
      "Régénère le jeu de données fictif de recette à 5h": { cron_string: "0 5 * * *" },
    });
    for (const env of ["production", "preprod", "local", "test"]) {
      expect(buildSeedRecetteCrons(env)).toEqual({});
    }
  });
});
