import MockDate from "mockdate";
import { strict as assert } from "assert";
import { ObjectId } from "mongodb";

import { startServer, createAdminUser, createSimpleUser } from "../../utils/testUtils.js";
import { createUser } from "../../../src/common/actions/users.actions.js";

const ADMIN_USERS_ENDPOINT = "/api/v1/admin/users";

describe("Users Route", () => {
  beforeEach(async () => {
    // Crée une entrée en base
    await createUser(
      { email: "of@test.fr", password: "Secret!Password1" },
      {
        nom: "of",
        prenom: "test",
        roles: ["of"],
        account_status: "FORCE_RESET_PASSWORD",
      }
    );
  });

  afterEach(() => {
    MockDate.reset();
  });

  describe("GET /users", () => {
    it("sends a 401 HTTP response when user is not authenticated", async () => {
      const { httpClient } = await startServer();
      const response = await httpClient.get(ADMIN_USERS_ENDPOINT, {});

      assert.strictEqual(response.status, 401);
    });

    it("sends a 403 HTTP response when user is not admin", async () => {
      const { httpClient, logUser } = await startServer();
      const { email, password } = await createSimpleUser();
      const { cookie } = await logUser(email, password);

      const response = await httpClient.get(ADMIN_USERS_ENDPOINT, { headers: { cookie } });

      assert.strictEqual(response.status, 403);
    });

    it("sends a 200 HTTP response with list of users", async () => {
      const { httpClient, logUser } = await startServer();
      const { email, password } = await createAdminUser();
      const { cookie } = await logUser(email, password);

      const response = await httpClient.get(ADMIN_USERS_ENDPOINT, { headers: { cookie } });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.data.data.length, 2);
    });
  });
});

describe("GET /users/[id]", () => {
  it("sends a 401 HTTP response when user is not authenticated", async () => {
    const { httpClient } = await startServer();
    const response = await httpClient.get(`${ADMIN_USERS_ENDPOINT}/${new ObjectId()}`, {});

    assert.strictEqual(response.status, 401);
  });

  it("sends a 403 HTTP response when user is not admin", async () => {
    const { httpClient, logUser } = await startServer();
    const { email, password } = await createSimpleUser();
    const { cookie } = await logUser(email, password);

    const response = await httpClient.get(`${ADMIN_USERS_ENDPOINT}/${new ObjectId()}`, { headers: { cookie } });

    assert.strictEqual(response.status, 403);
  });

  it("sends a 400 HTTP response if invalid id", async () => {
    const { httpClient, logUser } = await startServer();
    const { email, password } = await createAdminUser();
    const { cookie } = await logUser(email, password);

    const response = await httpClient.get(`${ADMIN_USERS_ENDPOINT}/invalidUserId`, { headers: { cookie } });

    assert.strictEqual(response.status, 400);
  });

  it("sends a 404 HTTP response if user not found", async () => {
    const { httpClient, logUser } = await startServer();
    const { email, password } = await createAdminUser();
    const { cookie } = await logUser(email, password);

    const response = await httpClient.get(`${ADMIN_USERS_ENDPOINT}/${new ObjectId()}`, { headers: { cookie } });

    assert.strictEqual(response.status, 404);
  });

  it("sends a 200 HTTP response if user is found", async () => {
    const { httpClient, logUser } = await startServer();
    const { _id, email, password } = await createAdminUser();
    const { cookie } = await logUser(email, password);

    const response = await httpClient.get(`${ADMIN_USERS_ENDPOINT}/${_id}`, { headers: { cookie } });
    assert.strictEqual(response.status, 200);
  });
});

describe.only("POST /users", () => {
  it("sends a 401 HTTP response when user is not authenticated", async () => {
    const { httpClient } = await startServer();
    const response = await httpClient.post(ADMIN_USERS_ENDPOINT, {});

    assert.strictEqual(response.status, 401);
  });

  it("sends a 403 HTTP response when user is not admin", async () => {
    const { httpClient, logUser } = await startServer();
    const { email, password } = await createSimpleUser();
    const { cookie } = await logUser(email, password);

    const response = await httpClient.post(ADMIN_USERS_ENDPOINT, {}, { headers: { cookie } });

    assert.strictEqual(response.status, 403);
  });

  it.only("sends a 400 HTTP response if invalid data", async () => {
    const { httpClient, logUser } = await startServer();
    const { email, password } = await createAdminUser();
    const { cookie } = await logUser(email, password);

    const response = await httpClient.post(ADMIN_USERS_ENDPOINT, { is_admin: true }, { headers: { cookie } });

    assert.strictEqual(response.status, 400);
  });

  it("sends a 200 HTTP response if valid data", async () => {
    const { httpClient, logUser } = await startServer();
    const { _id, email, password } = await createAdminUser();
    const { cookie } = await logUser(email, password);

    const response = await httpClient.post(ADMIN_USERS_ENDPOINT, {}, { headers: { cookie } });
    assert.strictEqual(response.status, 200);
  });
});
