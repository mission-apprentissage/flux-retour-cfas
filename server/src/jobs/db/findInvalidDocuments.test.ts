import { afterEach, describe, expect, it, vi } from "vitest";

import logger from "@/common/logger";
import { modelDescriptors } from "@/common/model/collections";
import { configureDbSchemaValidation, getDatabase } from "@/common/mongodb";
import { useMongo } from "@tests/jest/setupMongo";

import { findInvalidDocuments } from "./findInvalidDocuments";

const COLLECTION = "usersMigration";

const insertInvalidDocuments = async (count: number) => {
  await getDatabase()
    .collection(COLLECTION)
    .insertMany(
      Array.from({ length: count }, () => ({ champ_inconnu: true })),
      { bypassDocumentValidation: true }
    );
};

const markedDocuments = () => getDatabase().collection(COLLECTION).countDocuments({ invalidDoc: true });

describe("findInvalidDocuments", () => {
  useMongo();

  afterEach(async () => {
    vi.restoreAllMocks();
    await configureDbSchemaValidation(modelDescriptors);
  });

  it("détaille les documents invalides sans les modifier", async () => {
    await insertInvalidDocuments(3);
    const info = vi.spyOn(logger, "info");

    await findInvalidDocuments(COLLECTION);

    expect(info.mock.calls.filter(([message]) => String(message).startsWith(" #"))).toHaveLength(3);
    expect(await markedDocuments()).toBe(0);
  });

  it("respecte la limite", async () => {
    await insertInvalidDocuments(3);
    const info = vi.spyOn(logger, "info");

    await findInvalidDocuments(COLLECTION, 2);

    expect(info.mock.calls.filter(([message]) => String(message).startsWith(" #"))).toHaveLength(2);
  });

  it("refuse de tourner quand le validateur n'est pas en strict", async () => {
    await insertInvalidDocuments(1);
    await configureDbSchemaValidation(modelDescriptors, { level: "moderate" });

    await expect(findInvalidDocuments(COLLECTION)).rejects.toThrow("Recherche refusée");
    expect(await markedDocuments()).toBe(0);
  });

  it("refuse de tourner quand le validateur en base diffère du modèle", async () => {
    await insertInvalidDocuments(1);
    await getDatabase().command({
      collMod: COLLECTION,
      validator: { $jsonSchema: { bsonType: "object" } },
      validationLevel: "strict",
      validationAction: "error",
    });

    await expect(findInvalidDocuments(COLLECTION)).rejects.toThrow("absent ou différent du modèle");
  });

  it("refuse de tourner quand le validateur en base est absent", async () => {
    await getDatabase().command({ collMod: COLLECTION, validator: {} });

    await expect(findInvalidDocuments(COLLECTION)).rejects.toThrow("absent ou différent du modèle");
  });

  it("refuse une collection sans validateur au modèle", async () => {
    await expect(findInvalidDocuments("collectionInconnue")).rejects.toThrow("aucun validateur au modèle");
  });

  it("refuse une limite invalide", async () => {
    await expect(findInvalidDocuments(COLLECTION, Number.NaN)).rejects.toThrow("invalide");
  });
});
