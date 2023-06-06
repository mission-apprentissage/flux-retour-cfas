import { AxiosInstance } from "axiosist";

import { setTime } from "@/common/utils/timeUtils";
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
    it("retourne 400 si l'email est invalide", async () => {
      const response = await httpClient.post("/api/v1/password/forgotten-password", {
        email: "oops",
      });

      expect(response.status).toBe(400);
    });

    it("retourne 200 si le mail est valide", async () => {
      const response = await httpClient.post("/api/v1/password/forgotten-password", {
        email: "user@example.org",
      });
      expect(response.status).toBe(200);
    });
  });
});
