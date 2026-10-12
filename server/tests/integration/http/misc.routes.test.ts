import { strict as assert } from "assert";

import { AxiosInstance } from "axiosist";
import { it, expect, describe, beforeEach, vi, afterEach } from "vitest";

import * as collections from "@/common/model/collections";
import config from "@/config";
import { useMongo } from "@tests/jest/setupMongo";
import { initTestApp } from "@tests/utils/testUtils";

let httpClient: AxiosInstance;

describe("Routes diverses", () => {
  useMongo();
  beforeEach(async () => {
    const app = await initTestApp();
    httpClient = app.httpClient;
  });

  it("GET / - version du serveur", async () => {
    const response = await httpClient.get("/api");

    expect(response.status).toBe(200);
    assert.deepStrictEqual(response.data, {
      name: "TDB Apprentissage API",
      version: config.version,
      env: config.env,
    });
  });

  it("GET /healthcheck - version avec healthcheck MongoDB", async () => {
    const response = await httpClient.get("/api/healthcheck");

    expect(response.status).toBe(200);
    assert.deepStrictEqual(response.data, {
      name: "TDB Apprentissage API",
      version: config.version,
      env: config.env,
      healthcheck: {
        mongodb: true,
      },
    });
  });

  describe("readiness", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("répond 200 quand MongoDB répond", async () => {
      const response = await httpClient.get("/api/healthcheck/readiness");

      expect(response.status).toBe(200);
      expect(response.data.healthcheck).toEqual({ mongodb: true });
    });

    it("répond 503 quand MongoDB est injoignable", async () => {
      vi.spyOn(collections, "usersMigrationDb").mockReturnValue({
        findOne: () => Promise.reject(new Error("connexion refusée")),
      } as never);

      const response = await httpClient.get("/api/healthcheck/readiness");

      expect(response.status).toBe(503);
      expect(response.data.healthcheck).toEqual({ mongodb: false });
    });

    // La sonde Docker lit /api/healthcheck : un 503 y ferait redémarrer les deux
    // réplicas, y compris pendant un déploiement où Mongo est brièvement absent.
    it("laisse la sonde de liveness en 200 même si MongoDB est injoignable", async () => {
      vi.spyOn(collections, "usersMigrationDb").mockReturnValue({
        findOne: () => Promise.reject(new Error("connexion refusée")),
      } as never);

      const response = await httpClient.get("/api/healthcheck");

      expect(response.status).toBe(200);
      expect(response.data.healthcheck).toEqual({ mongodb: false });
    });
  });
});
