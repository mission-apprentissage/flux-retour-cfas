import { AxiosInstance } from "axiosist";
import { ObjectId } from "mongodb";

import { usersMigrationDb } from "@/common/model/collections";
import { sendEmail } from "@/common/services/mailer/mailer";
import { setTime } from "@/common/utils/timeUtils";
import { useMongo } from "@tests/jest/setupMongo";
import { id, initTestApp, testPasswordHash } from "@tests/utils/testUtils";

const date = "2022-10-10T00:00:00.000Z";

let app: Awaited<ReturnType<typeof initTestApp>>;
let httpClient: AxiosInstance;

describe("Password", () => {
  useMongo();
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
        email: "idontexist@example.org",
      });
      expect(response.status).toBe(200);
    });

    it("retourne 200 et envoie un mail si le mail est valide et l'utilisateur existe", async () => {
      (sendEmail as jest.MockedFunction<typeof sendEmail>).mockClear();
      await usersMigrationDb().insertOne({
        account_status: "CONFIRMED",
        created_at: new Date(date),
        civility: "Madame",
        nom: "Dupont",
        prenom: "Jean",
        email: "user@example.org",
        password: testPasswordHash,
        organisation_id: new ObjectId(id(1)),
      });
      const response = await httpClient.post("/api/v1/password/forgotten-password", {
        email: "user@example.org",
      });
      expect(response.status).toBe(200);
      expect(sendEmail).toBeCalledTimes(1);
    });
  });
});
