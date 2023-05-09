import { strict as assert } from "assert";

import { AxiosInstance } from "axiosist";

import { packageJson } from "@/common/utils/esmUtils";
import config from "@/config";
import { initTestApp } from "@tests/utils/testUtils";

let httpClient: AxiosInstance;

describe("Routes diverses", () => {
  beforeEach(async () => {
    const app = await initTestApp();
    httpClient = app.httpClient;
  });

  it("GET / - version du serveur", async () => {
    const response = await httpClient.get("/api");

    expect(response.status).toBe(200);
    assert.deepStrictEqual(response.data, {
      name: "TDB Apprentissage API",
      version: packageJson.version,
      env: config.env,
    });
  });

  it("GET /healthcheck - version avec healthcheck MongoDB", async () => {
    const response = await httpClient.get("/api/healthcheck");

    expect(response.status).toBe(200);
    assert.deepStrictEqual(response.data, {
      name: "TDB Apprentissage API",
      version: packageJson.version,
      env: config.env,
      healthcheck: {
        mongodb: true,
      },
    });
  });
});
