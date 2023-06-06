import { AxiosInstance } from "axiosist";

import { setTime } from "@/common/utils/timeUtils";
import { createOrganisation, createUser } from "@tests/utils/helpers";
import { initTestApp } from "@tests/utils/testUtils";

const date = "2022-10-10T00:00:00.000Z";

let app: Awaited<ReturnType<typeof initTestApp>>;
let httpClient: AxiosInstance;

describe("Password", () => {
  beforeEach(async () => {
    app = await initTestApp();
    httpClient = app.httpClient;
    setTime(new Date(date));
  });

  describe("POST /v1/password/forgotten-password - forgotten password", () => {
    beforeEach(async () => {
      await Promise.all([createOrganisation(), createUser()]);
    });

    it("retourne 400 si l'email est invalide", async () => {
      const response = await httpClient.post("/api/v1/password/forgotten-password", {
        email: "oops",
        password: "oops",
      });

      expect(response.status).toBe(400);
    });

    it("retourne 200 si le mail est valide", async () => {
      const response = await httpClient.post("/api/v1/auth/login", {
        email: "user@example.org",
        password: "MDP-azerty123",
      });
      expect(response.status).toBe(200);
    });
  });
});
