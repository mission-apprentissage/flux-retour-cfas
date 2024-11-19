import { strict as assert } from "assert";

import { AxiosInstance } from "axiosist";
import { it, expect, describe, beforeEach } from "vitest";

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
});
