import { describe, expect, it } from "vitest";

import { getDatabase } from "@/common/mongodb";
import { useMongo } from "@tests/jest/setupMongo";

import { validateModels } from "./schemaValidation";

describe("validateModels", () => {
  useMongo();

  it("passe sur une base sans document invalide", async () => {
    await expect(validateModels()).resolves.toBeUndefined();
  });

  it("signale toutes les collections invalides, pas seulement la première", async () => {
    for (const collectionName of ["effectifsArchive", "usersMigration"]) {
      await getDatabase()
        .collection(collectionName)
        .insertOne({ champ_inconnu: true }, { bypassDocumentValidation: true });
    }

    await expect(validateModels()).rejects.toThrow(
      /effectifsArchive \(1\).*usersMigration \(1\)|usersMigration \(1\).*effectifsArchive \(1\)/
    );
  });
});
