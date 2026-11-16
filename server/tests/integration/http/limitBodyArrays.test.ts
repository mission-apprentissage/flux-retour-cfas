import { AxiosInstance } from "axiosist";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import config from "@/config";
import { MAX_BODY_ARRAY_ITEMS } from "@/http/middlewares/limitBodyArrays";
import { useMongo } from "@tests/jest/setupMongo";
import { initTestApp } from "@tests/utils/testUtils";

let httpClient: AxiosInstance;
let originalBodyParserLimit: string;

describe("Plafond des tableaux dans le corps des requêtes", () => {
  useMongo();

  beforeEach(async () => {
    originalBodyParserLimit = config.bodyParserLimit;
    // La limite de taille de l'environnement de test (100kb) refuserait la requête avant le garde.
    Object.assign(config, { bodyParserLimit: "10mb" });
    const app = await initTestApp();
    httpClient = app.httpClient;
  });

  afterEach(() => {
    Object.assign(config, { bodyParserLimit: originalBodyParserLimit });
  });

  it("refuse en 413 un tableau trop long avant toute validation", async () => {
    const response = await httpClient.post("/api/v1/auth/login", { ids: new Array(MAX_BODY_ARRAY_ITEMS + 1).fill(1) });

    expect(response.status).toBe(413);
    expect(response.data.message).toContain("éléments de tableau");
  });

  it("laisse la requête atteindre la validation de la route quand le tableau est dans la limite", async () => {
    const response = await httpClient.post("/api/v1/auth/login", { ids: new Array(10).fill(1) });

    expect(response.status).not.toBe(413);
  });
});
