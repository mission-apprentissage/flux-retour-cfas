import { strict as assert } from "assert";

import { startServer, createAdminUser, createSimpleUser } from "../../utils/testUtils.js";

const ADMIN_MAINTENANCE_ENDPOINT = "/api/v1/admin/maintenanceMessages";
const PUBLIC_MAINTENANCE_ENDPOINT = "/api/v1/maintenanceMessages";
const SAMPLE_VALID_MAINTENANCE_MESSAGE = { msg: "Message d'alerte", type: "alert", context: "manuel", enabled: false };

describe("Maintenances Route", () => {
  describe("POST /admin/maintenanceMessages", () => {
    it("sends a 401 HTTP response when user is not authenticated", async () => {
      const { httpClient } = await startServer();
      const response = await httpClient.post(ADMIN_MAINTENANCE_ENDPOINT, {});

      assert.equal(response.status, 401);
    });

    it("sends a 403 HTTP response when user is not admin", async () => {
      const { httpClient, logUser } = await startServer();

      const { email, password } = await createSimpleUser();
      const { cookie } = await logUser(email, password);
      const response = await httpClient.post(ADMIN_MAINTENANCE_ENDPOINT, {}, { headers: { cookie } });

      assert.equal(response.status, 403);
    });

    it("sends a 400 HTTP response if data are not valid", async () => {
      const { httpClient, logUser } = await startServer();
      const { email, password } = await createAdminUser();
      const { cookie } = await logUser(email, password);
      const response = await httpClient.post(ADMIN_MAINTENANCE_ENDPOINT, {}, { headers: { cookie } });

      assert.deepEqual(response.data, {
        error: "Bad Request",
        message: "Erreur de validation",
        details: [
          {
            message: '"msg" is required',
            path: ["msg"],
            type: "any.required",
            context: { label: "msg", key: "msg" },
          },
          {
            message: '"type" is required',
            path: ["type"],
            type: "any.required",
            context: { label: "type", key: "type" },
          },
          {
            message: '"enabled" is required',
            path: ["enabled"],
            type: "any.required",
            context: { label: "enabled", key: "enabled" },
          },
          {
            message: '"context" is required',
            path: ["context"],
            type: "any.required",
            context: { label: "context", key: "context" },
          },
        ],
      });
    });

    it("sends a 201 HTTP response if a message maintenance is created", async () => {
      const { httpClient, logUser } = await startServer();

      const { email, password } = await createAdminUser();
      const { cookie } = await logUser(email, password);

      const response = await httpClient.post(ADMIN_MAINTENANCE_ENDPOINT, SAMPLE_VALID_MAINTENANCE_MESSAGE, {
        headers: { cookie },
      });
      assert.equal(response.status, 201);
      assert.deepEqual(response.data, {
        ...SAMPLE_VALID_MAINTENANCE_MESSAGE,
        name: "admin@test.beta.gouv.fr",
        _id: response.data._id,
        time: response.data.time,
      });
    });
  });

  describe("PUT /admin/maintenanceMessages", () => {
    it("sends a 401 HTTP response when user is not authenticated", async () => {
      const { httpClient } = await startServer();
      const response = await httpClient.post(`${ADMIN_MAINTENANCE_ENDPOINT}/1`, {});

      assert.equal(response.status, 401);
    });

    it("sends a 403 HTTP response when user is not admin", async () => {
      const { httpClient, logUser } = await startServer();

      const { email, password } = await createSimpleUser();
      const { cookie } = await logUser(email, password);
      const response = await httpClient.post(`${ADMIN_MAINTENANCE_ENDPOINT}/1`, {}, { headers: { cookie } });

      assert.equal(response.status, 403);
    });

    it("sends a 200 HTTP response if a message maintenance is updated", async () => {
      const { httpClient, logUser } = await startServer();

      const { email, password } = await createAdminUser();
      const { cookie } = await logUser(email, password);

      const createResponse = await httpClient.post(ADMIN_MAINTENANCE_ENDPOINT, SAMPLE_VALID_MAINTENANCE_MESSAGE, {
        headers: { cookie },
      });
      assert.equal(createResponse.status, 201);
      const _id = createResponse.data._id;

      const updateResponse = await httpClient.put(
        `${ADMIN_MAINTENANCE_ENDPOINT}/${_id}`,
        { ...SAMPLE_VALID_MAINTENANCE_MESSAGE, msg: "Message d'alerte MAJ", enabled: true },
        {
          headers: { cookie },
        }
      );
      assert.equal(updateResponse.status, 200);
      assert.deepEqual(updateResponse.data, {
        ...SAMPLE_VALID_MAINTENANCE_MESSAGE,
        msg: "Message d'alerte MAJ",
        name: "admin@test.beta.gouv.fr",
        enabled: true,
        _id,
        time: createResponse.data.time,
      });
    });
  });

  describe("DELETE /admin/maintenanceMessages", () => {
    it("sends a 401 HTTP response when user is not authenticated", async () => {
      const { httpClient } = await startServer();
      const response = await httpClient.delete(`${ADMIN_MAINTENANCE_ENDPOINT}/1`, {});

      assert.equal(response.status, 401);
    });

    it("sends a 403 HTTP response when user is not admin", async () => {
      const { httpClient, logUser } = await startServer();

      const { email, password } = await createSimpleUser();
      const { cookie } = await logUser(email, password);
      const response = await httpClient.delete(`${ADMIN_MAINTENANCE_ENDPOINT}/1`, { headers: { cookie } });

      assert.equal(response.status, 403);
    });

    it("sends a 200 HTTP response if a message maintenance is deleted", async () => {
      const { httpClient, logUser } = await startServer();

      const { email, password } = await createAdminUser();
      const { cookie } = await logUser(email, password);

      const createResponse = await httpClient.post(ADMIN_MAINTENANCE_ENDPOINT, SAMPLE_VALID_MAINTENANCE_MESSAGE, {
        headers: { cookie },
      });
      assert.equal(createResponse.status, 201);
      const _id = createResponse.data._id;

      const deleteResponse = await httpClient.delete(`${ADMIN_MAINTENANCE_ENDPOINT}/${_id}`, {
        headers: { cookie },
      });
      assert.equal(deleteResponse.status, 200);
    });
  });

  describe("GET /maintenanceMessages", () => {
    before(async () => {
      const { httpClient, logUser } = await startServer();
      const { email, password } = await createAdminUser();
      const { cookie } = await logUser(email, password);
      await httpClient.post(ADMIN_MAINTENANCE_ENDPOINT, SAMPLE_VALID_MAINTENANCE_MESSAGE, {
        headers: { cookie },
      });
    });

    it("sends a 200 HTTP response when user is not authenticated", async () => {
      const { httpClient } = await startServer();
      const response = await httpClient.get(PUBLIC_MAINTENANCE_ENDPOINT, {});

      assert.equal(response.status, 200);
      assert.deepEqual(response.data.length, 1);
      assert.deepEqual(response.data[0], {
        ...SAMPLE_VALID_MAINTENANCE_MESSAGE,
        name: "admin@test.beta.gouv.fr",
        _id: response.data[0]._id,
        time: response.data[0].time,
      });
    });
  });
});
