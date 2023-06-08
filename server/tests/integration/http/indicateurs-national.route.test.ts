import { AxiosInstance } from "axiosist";

import { initTestApp } from "@tests/utils/testUtils";

let app: Awaited<ReturnType<typeof initTestApp>>;
let httpClient: AxiosInstance;
describe("GET /api/v1/indicateurs-national - liste des indicateurs sur les effectifs et organismes au national ", () => {
  beforeEach(async () => {
    app = await initTestApp();
    httpClient = app.httpClient;
  });

  it("Accès public", async () => {
    const date = "2020-10-10T00:00:00.000Z";
    const response = await httpClient.get(`/api/v1/indicateurs-national?date=${date}`);

    expect(response.status).toEqual(200);
    expect(response.status).toStrictEqual({ indicateursEffectifs: [], indicateursOrganismes: [] });
  });
});
