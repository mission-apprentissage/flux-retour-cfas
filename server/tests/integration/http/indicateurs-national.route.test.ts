import { AxiosInstance } from "axiosist";

import { organismesDb } from "@/common/model/collections";
import { organismes } from "@tests/utils/permissions";
import { initTestApp } from "@tests/utils/testUtils";

let app: Awaited<ReturnType<typeof initTestApp>>;
let httpClient: AxiosInstance;

describe("GET /api/v1/indicateurs/national - liste des indicateurs sur les effectifs et organismes au national ", () => {
  beforeEach(async () => {
    app = await initTestApp();
    httpClient = app.httpClient;
    await organismesDb().insertMany(organismes);
  });

  it("Accès public", async () => {
    const date = "2020-10-10T00:00:00.000Z";
    const response = await httpClient.get(`/api/v1/indicateurs/national?date=${date}`);

    expect(response.status).toEqual(200);
    expect(response.data).toStrictEqual({
      indicateursEffectifs: [],
      indicateursOrganismes: {
        total: 4,
        responsablesFormateurs: 2,
        responsables: 1,
        formateurs: 1,
      },
    });
  });
});
