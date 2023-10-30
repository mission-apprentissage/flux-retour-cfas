import { strict as assert } from "assert";

import { AxiosInstance } from "axiosist";
import { TETE_DE_RESEAUX, TETE_DE_RESEAUX_BY_ID } from "shared";

import { initTestApp } from "@tests/utils/testUtils";

let httpClient: AxiosInstance;

// TODO route non utilisée, probablement à supprimer sachant qu'on a le dossier shared avec les constantes réseaux
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
