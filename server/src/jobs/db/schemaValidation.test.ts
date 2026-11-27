import { afterEach, describe, expect, it } from "vitest";

import { modelDescriptors } from "@/common/model/collections";
import { configureDbSchemaValidation, getDatabase } from "@/common/mongodb";
import { useMongo } from "@tests/jest/setupMongo";

import { validateModels } from "./schemaValidation";

describe("validateModels", () => {
  useMongo();

  afterEach(async () => {
    await configureDbSchemaValidation(modelDescriptors);
  });

  it("passe sur une base sans document invalide", async () => {
    await expect(validateModels()).resolves.toBeUndefined();
  });

  it("ignore une collection absente de la base", async () => {
    await getDatabase().collection("jwtSessions").drop();

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

  it("signale un validateur resté en moderate", async () => {
    await configureDbSchemaValidation(modelDescriptors, { level: "moderate" });

    await expect(validateModels()).rejects.toThrow(/Validateurs non conformes : .*usersMigration \(moderate, error\)/);
  });

  it("signale un validateur en off", async () => {
    await getDatabase().command({ collMod: "voeuxAffelnet", validationLevel: "off" });

    await expect(validateModels()).rejects.toThrow("Validateurs non conformes : voeuxAffelnet (off, error)");
  });

  it("signale un validateur absent ou différent du modèle, et compte les documents selon le modèle", async () => {
    await getDatabase().command({ collMod: "usersMigration", validator: {} });
    await getDatabase().collection("usersMigration").insertOne({ champ_inconnu: true });

    await expect(validateModels()).rejects.toThrow(
      "Validateurs non conformes : usersMigration (absent ou différent du modèle). Documents invalides : usersMigration (1)"
    );
  });
});
