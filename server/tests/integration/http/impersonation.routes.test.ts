import { AxiosInstance } from "axiosist";
import { it, expect, describe, beforeEach } from "vitest";

import { useMongo } from "@tests/jest/setupMongo";
import { PermissionsTestConfig, testPermissions } from "@tests/utils/permissions";
import { RequestAsOrganisationFunc, expectUnauthorizedError, initTestApp } from "@tests/utils/testUtils";

let app: Awaited<ReturnType<typeof initTestApp>>;
let httpClient: AxiosInstance;
let requestAsOrganisation: RequestAsOrganisationFunc;

useMongo();
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
      "OF cible": false,
      "OF non lié": false,
      "OF formateur": false,
      "OF responsable": false,
      "Tête de réseau même réseau": false,
      "Tête de réseau Responsable": false,
      "Tête de réseau autre réseau": false,
      "DREETS même région": false,
      "DREETS autre région": false,
      "DRAFPIC régional même région": false,
      "DRAFPIC régional autre région": false,
      "DRAAF même région": false,
      "DRAAF autre région": false,
      "Conseil Régional même région": false,
      "Conseil Régional autre région": false,
      "CARIF OREF régional même région": false,
      "CARIF OREF régional autre région": false,
      "DDETS même département": false,
      "DDETS autre département": false,
      "Académie même académie": false,
      "Académie autre académie": false,
      "Opérateur public national": false,
      "CARIF OREF national": false,
      Administrateur: true,
    };
    testPermissions(accesOrganisme, async (organisation, allowed) => {
      const response = await requestAsOrganisation(organisation, "post", "/api/v1/admin/impersonate", {
        type: "DREETS",
        code_region: "53",
      });

      expect(response.status).toStrictEqual(allowed ? 200 : 403);
      expect(response.headers["set-cookie"]).toStrictEqual(
        allowed ? [expect.stringMatching("flux-retour-cfas-test-jwt=eyJh.*")] : undefined
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
      "OF cible": false,
      "OF non lié": false,
      "OF formateur": false,
      "OF responsable": false,
      "Tête de réseau même réseau": false,
      "Tête de réseau Responsable": false,
      "Tête de réseau autre réseau": false,
      "DREETS même région": false,
      "DREETS autre région": false,
      "DRAFPIC régional même région": false,
      "DRAFPIC régional autre région": false,
      "DRAAF même région": false,
      "DRAAF autre région": false,
      "Conseil Régional même région": false,
      "Conseil Régional autre région": false,
      "CARIF OREF régional même région": false,
      "CARIF OREF régional autre région": false,
      "DDETS même département": false,
      "DDETS autre département": false,
      "Académie même académie": false,
      "Académie autre académie": false,
      "Opérateur public national": false,
      "CARIF OREF national": false,
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
          expect.stringMatching("flux-retour-cfas-test-jwt=eyJh.*"),
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
  expect(response.data).toMatchObject({
    _id: expect.any(String),
    account_status: "CONFIRMED",
    civility: "Madame",
    nom: "Dupont",
    prenom: "Jean",
    email: "Administrateur@tdb.local",
    fonction: "Responsable administratif",
    has_accept_cgu_version: "v0.1",
    telephone: "",
    created_at: expect.any(String),
    password_updated_at: expect.any(String),
    impersonating: true,
    organisation: {
      _id: expect.any(String),
      created_at: expect.any(String),
      code_region: "53",
      type: "DREETS",
    },
    organisation_id: expect.any(String),
    acl: {
      configurerModeTransmission: false,
      effectifsNominatifs: {
        abandon: false,
        apprenant: false,
        apprenti: false,
        inconnu: false,
        inscritSansContrat: false,
        rupturant: false,
      },
      indicateursEffectifs: false,
      infoTransmissionEffectifs: false,
      manageEffectifs: false,
      viewContacts: false,
    },
  });

  response = await httpClient.delete("/api/v1/admin/impersonate", { headers: { cookie } });
  expect(response.status).toStrictEqual(200);
  cookie = response.headers["set-cookie"]?.[0];

  // vérifie que l'organisation est revenue à la normale
  response = await httpClient.get("/api/v1/session", { headers: { cookie } });
  expect(response.status).toStrictEqual(200);
  expect(response.data).toMatchObject({
    _id: expect.any(String),
    account_status: "CONFIRMED",
    civility: "Madame",
    nom: "Dupont",
    prenom: "Jean",
    email: "Administrateur@tdb.local",
    fonction: "Responsable administratif",
    has_accept_cgu_version: "v0.1",
    telephone: "",
    created_at: expect.any(String),
    password_updated_at: expect.any(String),
    organisation: {
      _id: expect.any(String),
      created_at: expect.any(String),
      type: "ADMINISTRATEUR",
    },
    organisation_id: expect.any(String),
    acl: {
      configurerModeTransmission: true,
      effectifsNominatifs: {
        abandon: true,
        apprenant: true,
        apprenti: true,
        inconnu: true,
        inscritSansContrat: true,
        rupturant: true,
      },
      indicateursEffectifs: true,
      infoTransmissionEffectifs: true,
      manageEffectifs: true,
      viewContacts: true,
    },
  });
});
