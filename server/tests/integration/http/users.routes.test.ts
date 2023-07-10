import { AxiosInstance } from "axiosist";
import { ObjectId } from "mongodb";

import { UsersMigration } from "@/common/model/@types";
import { organisationsDb, usersMigrationDb } from "@/common/model/collections";
import {
  RequestAsOrganisationFunc,
  expectForbiddenError,
  expectUnauthorizedError,
  id,
  initTestApp,
  testPasswordHash,
} from "@tests/utils/testUtils";

let app: Awaited<ReturnType<typeof initTestApp>>;
let httpClient: AxiosInstance;
let requestAsOrganisation: RequestAsOrganisationFunc;

describe("Routes users", () => {
  beforeEach(async () => {
    app = await initTestApp();
    httpClient = app.httpClient;
    requestAsOrganisation = app.requestAsOrganisation;
  });
  beforeEach(async () => {
    await organisationsDb().insertOne({
      _id: new ObjectId(id(1)),
      type: "DREETS",
      code_region: "53",
      created_at: new Date(),
    });
  });

  describe("PUT /api/v1/admin/users/:id/validate - validation d'un compte", () => {
    it("Erreur si non authentifié", async () => {
      const response = await httpClient.put(`/api/v1/admin/users/${id(1)}/validate`);

      expectUnauthorizedError(response);
    });

    it("Validation d'un compte en attente de vérification d'email", async () => {
      await createUserWithStatus("PENDING_EMAIL_VALIDATION");
      const response = await requestAsOrganisation(
        {
          type: "ADMINISTRATEUR",
        },
        "put",
        `/api/v1/admin/users/${id(1)}/validate`
      );

      expect(response.status).toStrictEqual(200);
      expect(response.data).toStrictEqual({
        message: "success",
      });
    });

    it("Validation d'un compte en attente de validation admin", async () => {
      await createUserWithStatus("PENDING_ADMIN_VALIDATION");
      const response = await requestAsOrganisation(
        {
          type: "ADMINISTRATEUR",
        },
        "put",
        `/api/v1/admin/users/${id(1)}/validate`
      );

      expect(response.status).toStrictEqual(200);
      expect(response.data).toStrictEqual({
        message: "success",
      });
    });

    it("Erreur si compte déjà confirmé", async () => {
      await createUserWithStatus("CONFIRMED");
      const response = await requestAsOrganisation(
        {
          type: "ADMINISTRATEUR",
        },
        "put",
        `/api/v1/admin/users/${id(1)}/validate`
      );

      expectForbiddenError(response);
    });
  });

  describe("PUT /api/v1/admin/users/:id/reject - rejet d'un compte", () => {
    it("Erreur si non authentifié", async () => {
      const response = await httpClient.put(`/api/v1/admin/users/${id(1)}/reject`);

      expectUnauthorizedError(response);
    });

    it("Rejet d'un compte en attente de vérification d'email", async () => {
      await createUserWithStatus("PENDING_EMAIL_VALIDATION");
      const response = await requestAsOrganisation(
        {
          type: "ADMINISTRATEUR",
        },
        "put",
        `/api/v1/admin/users/${id(1)}/reject`
      );

      expect(response.status).toStrictEqual(200);
      expect(response.data).toStrictEqual({
        message: "success",
      });
    });

    it("Rejet d'un compte en attente de validation admin", async () => {
      await createUserWithStatus("PENDING_ADMIN_VALIDATION");
      const response = await requestAsOrganisation(
        {
          type: "ADMINISTRATEUR",
        },
        "put",
        `/api/v1/admin/users/${id(1)}/reject`
      );

      expect(response.status).toStrictEqual(200);
      expect(response.data).toStrictEqual({
        message: "success",
      });
    });

    it("Erreur si compte déjà confirmé", async () => {
      await createUserWithStatus("CONFIRMED");
      const response = await requestAsOrganisation(
        {
          type: "ADMINISTRATEUR",
        },
        "put",
        `/api/v1/admin/users/${id(1)}/reject`
      );

      expectForbiddenError(response);
    });
  });
});

async function createUserWithStatus(accountStatus: UsersMigration["account_status"]) {
  await usersMigrationDb().insertOne({
    _id: new ObjectId(id(1)),
    account_status: accountStatus,
    invalided_token: false,
    password_updated_at: new Date(),
    connection_history: [],
    emails: [],
    created_at: new Date(),
    civility: "Madame",
    nom: "Dupont",
    prenom: "Jean",
    fonction: "Responsable administratif",
    email: "guest@tdb.local",
    telephone: "",
    password: testPasswordHash,
    has_accept_cgu_version: "v0.1",
    organisation_id: new ObjectId(id(1)),
  });
}
