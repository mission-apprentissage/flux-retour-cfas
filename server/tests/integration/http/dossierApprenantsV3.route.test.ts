import { randomUUID } from "node:crypto";

import { AxiosInstance } from "axiosist";
import type { IOrganisme } from "shared/models";
import { it, expect, describe, beforeEach } from "vitest";

import { organismesDb } from "@/common/model/collections";
import { createRandomOrganisme, createRandomDossierApprenantApiInputV3 } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { initTestApp, testDoc } from "@tests/utils/testUtils";

const API_ENDPOINT_URL = "/api/v3/dossiers-apprenants";
let httpClient: AxiosInstance;

const uai = "0802004U";
const siret = "77937827200016";
const api_key = randomUUID();

describe("Dossier Apprenants Route V3", () => {
  useMongo();
  let randomOrganisme: ReturnType<typeof createRandomOrganisme>;
  beforeEach(async () => {
    const app = await initTestApp();
    randomOrganisme = createRandomOrganisme({ uai, siret, api_key });
    await organismesDb().insertOne(testDoc<IOrganisme>(randomOrganisme));
    httpClient = app.httpClient;
  });

  describe("POST v3/dossiers-apprenants", () => {
    it("Vérifie que les données additionnelles ne mettent pas l'API en erreur", async () => {
      const dossier = {
        ...createRandomDossierApprenantApiInputV3({
          etablissement_formateur_uai: uai,
          etablissement_formateur_siret: siret,
        }),
        bidule: "blabla",
      };

      const response = await httpClient.post(`${API_ENDPOINT_URL}`, [dossier], {
        headers: {
          Authorization: `Bearer ${api_key}`,
        },
      });
      expect(response.status).toBe(200);
    });
  });
});
