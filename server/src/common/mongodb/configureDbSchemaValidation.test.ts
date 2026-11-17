import { captureException } from "@sentry/node";
import { Db, MongoServerError } from "mongodb";
import { afterEach, describe, expect, it, vi } from "vitest";

import { modelDescriptors } from "@/common/model/collections";
import { configureDbSchemaValidation, getDatabase } from "@/common/mongodb";
import { useMongo } from "@tests/jest/setupMongo";

vi.mock("@sentry/node", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@sentry/node")>()),
  captureException: vi.fn(),
}));

useMongo();

const collModCalls = (spy: { mock: { calls: unknown[][] } }) =>
  spy.mock.calls.filter(([command]) => (command as { collMod?: string }).collMod !== undefined);

const validationLevels = async () => {
  const collections = await getDatabase().listCollections({}, { nameOnly: false }).toArray();
  return new Set(collections.filter((c) => c.options?.validator).map((c) => c.options?.validationLevel));
};

const indexBuildError = () => new MongoServerError({ message: "index build in progress", code: 12587 });

describe("configureDbSchemaValidation", () => {
  afterEach(async () => {
    vi.restoreAllMocks();
    await configureDbSchemaValidation(modelDescriptors);
  });

  it("ne relance aucun collMod quand rien ne change", async () => {
    const command = vi.spyOn(Db.prototype, "command");

    await configureDbSchemaValidation(modelDescriptors);

    expect(collModCalls(command)).toHaveLength(0);
  });

  it("passe toutes les collections en moderate puis les remet en strict", async () => {
    await configureDbSchemaValidation(modelDescriptors, { level: "moderate" });
    expect(await validationLevels()).toEqual(new Set(["moderate"]));

    await configureDbSchemaValidation(modelDescriptors, { level: "strict" });
    expect(await validationLevels()).toEqual(new Set(["strict"]));
  });

  it("recrée une collection manquante avec son validateur", async () => {
    await getDatabase().collection("jwtSessions").drop();

    await configureDbSchemaValidation(modelDescriptors);

    const [collection] = await getDatabase().listCollections({ name: "jwtSessions" }, { nameOnly: false }).toArray();
    expect(collection.options?.validationLevel).toBe("strict");
    expect(collection.options?.validator).toBeDefined();
  });

  it("tolère une collection créée entre-temps par un autre service", async () => {
    await getDatabase().collection("jwtSessions").drop();
    const realCreate = Db.prototype.createCollection;
    vi.spyOn(Db.prototype, "createCollection").mockImplementation(async function (this: Db, ...args) {
      await realCreate.apply(this, args);
      throw new MongoServerError({ message: "namespace exists", code: 48 });
    } as typeof realCreate);

    await expect(configureDbSchemaValidation(modelDescriptors)).resolves.toBeUndefined();
  });

  it("échoue pendant un build d'index par défaut", async () => {
    vi.spyOn(Db.prototype, "command").mockRejectedValue(indexBuildError());

    await expect(configureDbSchemaValidation(modelDescriptors, { level: "moderate" })).rejects.toMatchObject({
      code: 12587,
    });
  });

  it("avertit et poursuit pendant un build d'index au démarrage d'un service", async () => {
    vi.spyOn(Db.prototype, "command").mockRejectedValue(indexBuildError());

    await expect(
      configureDbSchemaValidation(modelDescriptors, { level: "moderate", onIndexBuild: "warn" })
    ).resolves.toBeUndefined();
    expect(captureException).toHaveBeenCalled();
  });

  it("ne tolère aucune autre erreur de collMod", async () => {
    vi.spyOn(Db.prototype, "command").mockRejectedValue(new MongoServerError({ message: "boom", code: 1 }));

    await expect(
      configureDbSchemaValidation(modelDescriptors, { level: "moderate", onIndexBuild: "warn" })
    ).rejects.toMatchObject({ code: 1 });
  });
});
