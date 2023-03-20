import { strict as assert } from "assert";
import { startServer } from "../../utils/testUtils.js";
import { RESEAUX_CFAS } from "../../../src/common/constants/networksConstants.js";

describe("Referentiel Route", () => {
  it("Vérifie qu'on peut récupérer les réseaux référentiels via API", async () => {
    const { httpClient } = await startServer();

    const response = await httpClient.get("/api/referentiel/networks");

    assert.deepStrictEqual(response.status, 200);
    const RESEAUX_CFAS_INVALID = ["ANASUP", "GRETA_VAUCLUSE", "BTP_CFA"];
    assert.deepStrictEqual(response.data.length, Object.values(RESEAUX_CFAS).length - RESEAUX_CFAS_INVALID.length);
    assert.deepStrictEqual(response.data[0].nom, RESEAUX_CFAS.ADEN.nomReseau);
  });
});
