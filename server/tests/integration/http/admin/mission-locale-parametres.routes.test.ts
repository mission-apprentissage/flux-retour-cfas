import { ObjectId } from "mongodb";
import type { IOrganisation } from "shared/models";
import { beforeEach, describe, expect, it } from "vitest";

import { organisationsDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";
import { RequestAsOrganisationFunc, initTestApp } from "@tests/utils/testUtils";

useMongo();

let requestAsOrganisation: RequestAsOrganisationFunc;

const ML_ID = new ObjectId();

describe("PUT /api/v1/admin/mission-locale/:id/parametres", () => {
  beforeEach(async () => {
    const app = await initTestApp();
    requestAsOrganisation = app.requestAsOrganisation;
    await organisationsDb().insertOne({
      _id: ML_ID,
      type: "MISSION_LOCALE",
      ml_id: 4242,
      nom: "ML Test",
      created_at: new Date(),
    } as IOrganisation);
  });

  it("enregistre le lien de rendez-vous en respectant le validateur de la collection", async () => {
    const response = await requestAsOrganisation(
      { type: "ADMINISTRATEUR" },
      "put",
      `/api/v1/admin/mission-locale/${ML_ID.toString()}/parametres`,
      { rdv_url: "https://example.org/rdv" }
    );

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ rdv_url: "https://example.org/rdv" });

    const saved = await organisationsDb().findOne({ _id: ML_ID });
    expect(saved).toMatchObject({ rdv_url: "https://example.org/rdv" });
    expect(saved).not.toHaveProperty("updated_at");
  });

  it("accepte la remise à zéro et refuse une URL invalide", async () => {
    const reset = await requestAsOrganisation(
      { type: "ADMINISTRATEUR" },
      "put",
      `/api/v1/admin/mission-locale/${ML_ID.toString()}/parametres`,
      { rdv_url: null }
    );
    expect(reset.status).toBe(200);

    const invalid = await requestAsOrganisation(
      { type: "ADMINISTRATEUR" },
      "put",
      `/api/v1/admin/mission-locale/${ML_ID.toString()}/parametres`,
      { rdv_url: "pas-une-url" }
    );
    expect(invalid.status).toBe(400);
  });
});
