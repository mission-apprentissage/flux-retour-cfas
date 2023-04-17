import { strict as assert } from "assert";
import { initTestApp } from "../../utils/testUtils.js";
import { AxiosInstance } from "axiosist";

let app: Awaited<ReturnType<typeof initTestApp>>;
let httpClient: AxiosInstance;
describe("GET /indicateurs-national", () => {
  before(async () => {
    app = await initTestApp();
    httpClient = app.httpClient;
  });

  it("Accès non authentifié", async () => {
    const date = "2020-10-10T00:00:00.000Z";
    const response = await httpClient.get(`/api/indicateurs-national?date=${date}`);

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.data, {
      date: date,
      apprentis: 0,
      inscritsSansContrat: 0,
      rupturants: 0,
      abandons: 0,
      totalOrganismes: 0,
    });
  });
});
