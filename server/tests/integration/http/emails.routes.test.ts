import { AxiosInstance } from "axiosist";
import { ObjectId } from "mongodb";
import { beforeEach, describe, expect, it } from "vitest";

import { usersMigrationDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";
import { initTestApp, testPasswordHash } from "@tests/utils/testUtils";

let httpClient: AxiosInstance;

const PAYLOAD = {
  recipient: { nom: "Dupont", prenom: "Jean", email: "jean.dupont@cfa.fr" },
  resetPasswordToken: "jeton-reinitialisation",
  role: "ORGANISME_FORMATION",
};

describe("Aperçu des courriels", () => {
  useMongo();

  beforeEach(async () => {
    httpClient = (await initTestApp()).httpClient;
    await usersMigrationDb().insertOne({
      _id: new ObjectId(),
      email: "jean.dupont@cfa.fr",
      password: testPasswordHash,
      nom: "Dupont",
      prenom: "Jean",
      organisation_id: new ObjectId(),
      account_status: "CONFIRMED",
      emails: [
        { token: "avec-charge", templateName: "reset_password", payload: PAYLOAD, sendDates: [new Date()] },
        { token: "sans-charge", templateName: "reset_password", sendDates: [new Date()] },
      ],
    });
  });

  it("affiche un courriel qui garde sa charge utile", async () => {
    const response = await httpClient.get("/api/emails/avec-charge/preview");

    expect(response.status).toBe(200);
    expect(response.data).toContain("Jean");
  });

  it("répond 404 quand la charge utile a été purgée", async () => {
    const response = await httpClient.get("/api/emails/sans-charge/preview");

    expect(response.status).toBe(404);
  });
});
