import { strict as assert } from "assert";
import config from "../../../src/config.js";
import { startServer } from "../../utils/testUtils.js";
import { packageJson } from "../../../src/common/utils/esmUtils.js";

describe("Healthcheck route", () => {
  it("Vérifie que le server fonctionne", async () => {
    const { httpClient } = await startServer();

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
