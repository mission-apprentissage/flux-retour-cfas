import { AxiosInstance } from "axiosist";

import logger from "@/common/logger";
import { PermissionsTestConfig, testPermissions } from "@tests/utils/permissions";
import { RequestAsOrganisationFunc, expectUnauthorizedError, initTestApp } from "@tests/utils/testUtils";

let app: Awaited<ReturnType<typeof initTestApp>>;
let httpClient: AxiosInstance;
let requestAsOrganisation: RequestAsOrganisationFunc;

beforeEach(async () => {
  app = await initTestApp();
  httpClient = app.httpClient;
  requestAsOrganisation = app.requestAsOrganisation;
});

describe("POST /api/v1/admin/impersonate - démarre une imposture d'organisation", () => {
  it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
    const response = await httpClient.post("/api/v1/admin/impersonate", {
      type: "DREETS",
      code_region: "53",
    });
    expectUnauthorizedError(response);
  });

  describe("Permissions", () => {
    const accesOrganisme: PermissionsTestConfig<boolean> = {
      "OFF lié": false,
      "OFF non lié": false,
      "OFR lié": false,
      "OFR responsable": false,
      "OFR non lié": false,
      "OFRF lié": false,
      "OFRF responsable": false,
      "OFRF non lié": false,
      "Tête de réseau": false,
      "Tête de réseau non liée": false,
      "DREETS même région": false,
      "DREETS autre région": false,
      "DDETS même département": false,
      "DDETS autre département": false,
      "ACADEMIE même académie": false,
      "ACADEMIE autre académie": false,
      "Opérateur public national": false,
      Administrateur: true,
    };
    testPermissions(accesOrganisme, async (organisation, allowed) => {
      const response = await requestAsOrganisation(organisation, "post", "/api/v1/admin/impersonate", {
        type: "DREETS",
        code_region: "53",
      });

      expect(response.status).toStrictEqual(allowed ? 200 : 403);
      expect(response.headers["set-cookie"]).toStrictEqual(
        allowed ? [expect.stringMatching("flux-retour-cfas-local-jwt=eyJh.*")] : undefined
      );
    });
  });
});

describe("DELETE /api/v1/admin/impersonate - arrête l'imposture d'organisation", () => {
  it("Vérifie qu'on ne peut pas accéder à la route sans être authentifié", async () => {
    const response = await httpClient.delete("/api/v1/admin/impersonate");
    expectUnauthorizedError(response);
  });

  describe("Permissions", () => {
    const accesOrganisme: PermissionsTestConfig<boolean> = {
      "OFF lié": false,
      "OFF non lié": false,
      "OFR lié": false,
      "OFR responsable": false,
      "OFR non lié": false,
      "OFRF lié": false,
      "OFRF responsable": false,
      "OFRF non lié": false,
      "Tête de réseau": false,
      "Tête de réseau non liée": false,
      "DREETS même région": false,
      "DREETS autre région": false,
      "DDETS même département": false,
      "DDETS autre département": false,
      "ACADEMIE même académie": false,
      "ACADEMIE autre académie": false,
      "Opérateur public national": false,
      Administrateur: true,
    };
    testPermissions(accesOrganisme, async (organisation, allowed) => {
      if (allowed) {
        let response = await requestAsOrganisation(organisation, "post", "/api/v1/admin/impersonate", {
          type: "DREETS",
          code_region: "53",
        });
        expect(response.status).toStrictEqual(200);
        const cookie = response.headers["set-cookie"]?.[0];

        response = await httpClient.delete("/api/v1/admin/impersonate", { headers: { cookie } });
        expect(response.status).toStrictEqual(200);
        expect(response.headers["set-cookie"]).toStrictEqual([
          expect.stringMatching("flux-retour-cfas-local-jwt=eyJh.*"),
        ]);
      } else {
        const response = await requestAsOrganisation(organisation, "delete", "/api/v1/admin/impersonate");

        expect(response.status).toStrictEqual(403);
        expect(response.headers["set-cookie"]).toStrictEqual(undefined);
      }
    });
  });
});

it("End to end - imposture d'organisation", async () => {
  logger.level("error");
  let response = await requestAsOrganisation(
    {
      type: "ADMINISTRATEUR",
    },
    "post",
    "/api/v1/admin/impersonate",
    {
      type: "DREETS",
      code_region: "53",
    }
  );
  expect(response.status).toStrictEqual(200);
  let cookie = response.headers["set-cookie"]?.[0];

  // vérifie que l'organisation a changé
  response = await httpClient.get("/api/v1/session", { headers: { cookie } });
  expect(response.data).toStrictEqual({
    _id: expect.any(String),
    account_status: "CONFIRMED",
    civility: "Madame",
    nom: "Dupont",
    prenom: "Jean",
    email: "Administrateur@test.local",
    fonction: "Responsable administratif",
    has_accept_cgu_version: "v0.1",
    telephone: "",
    invalided_token: false,
    created_at: expect.any(String),
    password_updated_at: expect.any(String),
    impersonating: true,
    organisation: {
      code_region: "53",
      type: "DREETS",
    },
    organisation_id: expect.any(String),
  });

  response = await httpClient.delete("/api/v1/admin/impersonate", { headers: { cookie } });
  expect(response.status).toStrictEqual(200);
  cookie = response.headers["set-cookie"]?.[0];

  // vérifie que l'organisation est revenue à la normale
  response = await httpClient.get("/api/v1/session", { headers: { cookie } });
  expect(response.status).toStrictEqual(200);
  expect(response.data).toStrictEqual({
    _id: expect.any(String),
    account_status: "CONFIRMED",
    civility: "Madame",
    nom: "Dupont",
    prenom: "Jean",
    email: "Administrateur@test.local",
    fonction: "Responsable administratif",
    has_accept_cgu_version: "v0.1",
    telephone: "",
    invalided_token: false,
    created_at: expect.any(String),
    password_updated_at: expect.any(String),
    organisation: {
      _id: expect.any(String),
      created_at: expect.any(String),
      type: "ADMINISTRATEUR",
    },
    organisation_id: expect.any(String),
  });
});
