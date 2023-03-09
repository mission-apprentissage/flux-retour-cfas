import { strict as assert } from "assert";
import { startServer } from "../../utils/testUtils";

describe("EffectifsNational Route", () => {
  it("Verifie si la route fonctionne et verifie si l'objet renvoyé est correct", async () => {
    const { httpClient } = await startServer();
    const response = await httpClient.get("/api/indicateurs-national", {
      params: { date: "2020-10-10T00:00:00.000Z" },
    });

    assert.equal(response.status, 200);
    assert.equal(response.data.date, "2020-10-10T00:00:00.000Z");
    assert.equal(response.data.totalOrganismes, 0);
    assert.equal(response.data.rupturants, 0);
    assert.equal(response.data.inscritsSansContrat, 0);
    assert.equal(response.data.abandons, 0);
  });
});
