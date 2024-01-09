import { AxiosInstance } from "axiosist";
import { Rncp } from "shared";

import { organismesDb, rncpDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";
import { organismes, testPermissions } from "@tests/utils/permissions";
import { RequestAsOrganisationFunc, expectUnauthorizedError, initTestApp } from "@tests/utils/testUtils";

let app: Awaited<ReturnType<typeof initTestApp>>;
let httpClient: AxiosInstance;
let requestAsOrganisation: RequestAsOrganisationFunc;

describe("GET /api/v1/rncp/:code_rncp - retourne une fiche RNCP", () => {
  useMongo();

  const ficheRNCP: Rncp = {
    rncp: "RNCP34956",
    actif: true,
    etat_fiche: "Publiée",
    intitule: "Arts de la cuisine",
    niveau: 4,
    romes: ["G1602"],
  };

  beforeEach(async () => {
    app = await initTestApp();
    httpClient = app.httpClient;
    requestAsOrganisation = app.requestAsOrganisation;
  });
  beforeEach(async () => {
    await Promise.all([
      organismesDb().insertMany(organismes),
      rncpDb().insertOne({ ...ficheRNCP }), // la copie par destructuring évite à insertOne d'ajouter _id à l'objet
    ]);
  });

  it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
    const response = await httpClient.get(`/api/v1/rncp/${ficheRNCP.rncp}`);
    expectUnauthorizedError(response);
  });

  describe("Permissions", () => {
    testPermissions(
      {
        "OF cible": true,
        "OF non lié": true,
        "OF formateur": true,
        "OF responsable": true,
        "Tête de réseau même réseau": true,
        "Tête de réseau Responsable": true,
        "Tête de réseau autre réseau": true,
        "DREETS même région": true,
        "DREETS autre région": true,
        "DRAFPIC régional même région": true,
        "DRAFPIC régional autre région": true,
        "DRAAF même région": true,
        "DRAAF autre région": true,
        "Conseil Régional même région": true,
        "Conseil Régional autre région": true,
        "CARIF OREF régional même région": true,
        "CARIF OREF régional autre région": true,
        "DDETS même département": true,
        "DDETS autre département": true,
        "Académie même académie": true,
        "Académie autre académie": true,
        "Opérateur public national": true,
        "CARIF OREF national": true,
        Administrateur: true,
      },
      async (organisation, allowed) => {
        const response = await requestAsOrganisation(organisation, "get", `/api/v1/rncp/${ficheRNCP.rncp}`);

        expect(response.status).toStrictEqual(allowed ? 200 : 403);
        expect(response.data).toStrictEqual({
          _id: expect.any(String),
          ...ficheRNCP,
        });
      }
    );
  });
});
