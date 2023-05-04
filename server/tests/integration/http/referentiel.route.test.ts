import { strict as assert } from "assert";

import { AxiosInstance } from "axiosist";

import { TETE_DE_RESEAUX, TETE_DE_RESEAUX_BY_ID } from "@/common/constants/networks";
import { initTestApp } from "@tests/utils/testUtils";

let httpClient: AxiosInstance;

// FIXME route authentifiée
xdescribe("Referentiel Route", () => {
  beforeEach(async () => {
    const app = await initTestApp();
    httpClient = app.httpClient;
  });

  it("Vérifie qu'on peut récupérer les réseaux référentiels via API", async () => {
    const response = await httpClient.get("/api/referentiel/networks");

    assert.deepStrictEqual(response.status, 200);
    const RESEAUX_CFAS_INVALID = ["ANASUP", "GRETA_VAUCLUSE", "BTP_CFA"];
    assert.deepStrictEqual(response.data.length, TETE_DE_RESEAUX.length - RESEAUX_CFAS_INVALID.length);
    assert.deepStrictEqual(response.data[0].nom, TETE_DE_RESEAUX_BY_ID["ADEN"].nom);
  });
});
