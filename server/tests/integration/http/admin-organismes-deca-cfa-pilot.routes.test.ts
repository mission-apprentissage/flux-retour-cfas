import { AxiosInstance } from "axiosist";
import { ObjectId } from "mongodb";
import { NATURE_ORGANISME_DE_FORMATION } from "shared/constants";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { getActiveAnneesScolaires } from "shared/utils/anneeScolaire";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { effectifsDb, organisationsDb, organismesDb } from "@/common/model/collections";
import { getDatabase } from "@/common/mongodb";
import { useMongo } from "@tests/jest/setupMongo";
import { RequestAsOrganisationFunc, expectUnauthorizedError, initTestApp } from "@tests/utils/testUtils";

useMongo();

beforeAll(async () => {
  await getDatabase().command({
    collMod: "missionLocaleEffectif",
    validationAction: "warn",
  });
});

let httpClient: AxiosInstance;
let requestAsOrganisation: RequestAsOrganisationFunc;

const [currentAnnee] = getActiveAnneesScolaires(new Date());

beforeEach(async () => {
  const app = await initTestApp();
  httpClient = app.httpClient;
  requestAsOrganisation = app.requestAsOrganisation;
});

async function seedEligibleOrganisme(siret: string, uai: string): Promise<ObjectId> {
  const id = new ObjectId();
  await organismesDb().insertOne(
    generateOrganismeFixture({
      _id: id,
      siret,
      uai,
      nature: NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
    }),
    { bypassDocumentValidation: true }
  );
  await organisationsDb().insertOne(
    {
      _id: new ObjectId(),
      type: "ORGANISME_FORMATION",
      siret,
      uai,
      organisme_id: id.toHexString(),
      created_at: new Date(),
    } as any,
    { bypassDocumentValidation: true }
  );
  await effectifsDb().insertOne({ _id: new ObjectId(), organisme_id: id, annee_scolaire: currentAnnee } as any, {
    bypassDocumentValidation: true,
  });
  return id;
}

describe("admin deca-cfa-pilot routes", () => {
  describe("GET /api/v1/admin/organismes/:id/deca-cfa-pilot-eligibility", () => {
    it("requires authentication", async () => {
      const response = await httpClient.get(
        `/api/v1/admin/organismes/${new ObjectId().toHexString()}/deca-cfa-pilot-eligibility`
      );
      expectUnauthorizedError(response);
    });

    it("returns eligibility result for an eligible organisme", async () => {
      const id = await seedEligibleOrganisme("10000000000001", "0010001A");
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        `/api/v1/admin/organismes/${id.toHexString()}/deca-cfa-pilot-eligibility`
      );
      expect(response.status).toBe(200);
      expect(response.data.eligible).toBe(true);
      expect(response.data.alreadyActive).toBe(false);
      expect(response.data.checks.exists_with_siret_uai.passed).toBe(true);
    });

    it("returns 400 for an invalid id", async () => {
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/organismes/not-valid/deca-cfa-pilot-eligibility"
      );
      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/v1/admin/organismes/deca-cfa-pilot/activate", () => {
    it("requires authentication", async () => {
      const response = await httpClient.post("/api/v1/admin/organismes/deca-cfa-pilot/activate", {
        items: [{ siret: "10000000000001", uai: "0010001A" }],
      });
      expectUnauthorizedError(response);
    });

    it("activates an eligible organisme", async () => {
      const id = await seedEligibleOrganisme("10000000000001", "0010001A");
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        "/api/v1/admin/organismes/deca-cfa-pilot/activate",
        { items: [{ siret: "10000000000001", uai: "0010001A" }] }
      );
      expect(response.status).toBe(200);
      expect(response.data.total).toBe(1);
      expect(response.data.items[0].status).toBe("activated");
      expect(response.data.items[0].organismeId).toBe(id.toHexString());
    });

    it("returns 400 for empty items", async () => {
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        "/api/v1/admin/organismes/deca-cfa-pilot/activate",
        { items: [] }
      );
      expect(response.status).toBe(400);
    });

    it("returns 400 for more than 100 items", async () => {
      const items = Array.from({ length: 101 }, (_, i) => ({
        siret: String(10000000000000 + i).slice(0, 14),
        uai: "0010001A",
      }));
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        "/api/v1/admin/organismes/deca-cfa-pilot/activate",
        { items }
      );
      expect(response.status).toBe(400);
    });

    it("returns 400 for invalid SIRET", async () => {
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        "/api/v1/admin/organismes/deca-cfa-pilot/activate",
        { items: [{ siret: "123", uai: "0010001A" }] }
      );
      expect(response.status).toBe(400);
    });

    it("returns 400 for invalid UAI", async () => {
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        "/api/v1/admin/organismes/deca-cfa-pilot/activate",
        { items: [{ siret: "10000000000001", uai: "INVALID" }] }
      );
      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/v1/admin/organismes/deca-cfa-pilot/deactivate", () => {
    it("requires authentication", async () => {
      const response = await httpClient.post("/api/v1/admin/organismes/deca-cfa-pilot/deactivate", {
        items: [{ siret: "10000000000001", uai: "0010001A" }],
      });
      expectUnauthorizedError(response);
    });

    it("deactivates a previously activated organisme", async () => {
      await seedEligibleOrganisme("10000000000001", "0010001A");
      await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        "/api/v1/admin/organismes/deca-cfa-pilot/activate",
        { items: [{ siret: "10000000000001", uai: "0010001A" }] }
      );
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        "/api/v1/admin/organismes/deca-cfa-pilot/deactivate",
        { items: [{ siret: "10000000000001", uai: "0010001A" }] }
      );
      expect(response.status).toBe(200);
      expect(response.data.items[0].status).toBe("deactivated");
    });
  });
});
