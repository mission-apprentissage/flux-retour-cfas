import { strict as assert } from "assert";
import { startServer } from "../../utils/testUtils";
import { RESEAUX_CFAS } from "../../../src/common/constants/networksConstants";

describe("Referentiel Route", () => {
  it("Vérifie qu'on peut récupérer les réseaux référentiels via API", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api/referentiel/networks");

    assert.deepStrictEqual(response.status, 200);
    assert.deepEqual(response.data.length, Object.values(RESEAUX_CFAS).length);
    assert.deepEqual(response.data[0].nom, RESEAUX_CFAS.ADEN.nomReseau);
  });
});
