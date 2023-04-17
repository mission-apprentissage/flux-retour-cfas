import { strict as assert } from "assert";
import config from "../../../src/config.js";
import { startServer } from "../../utils/testUtils.js";
import { packageJson } from "../../../src/common/utils/esmUtils.js";
import { AxiosInstance } from "axiosist";

let httpClient: AxiosInstance;

describe("Routes diverses", () => {
  before(async () => {
    const app = await startServer();
    httpClient = app.httpClient;
  });

  it("GET / - version du serveur", async () => {
    const response = await httpClient.get("/api");

    assert.equal(response.status, 200);
    assert.deepStrictEqual(response.data, {
      name: "TDB Apprentissage API",
      version: packageJson.version,
      env: config.env,
    });
  });

  it("GET /healthcheck - version avec healthcheck MongoDB", async () => {
    const response = await httpClient.get("/api/healthcheck");

    assert.equal(response.status, 200);
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
