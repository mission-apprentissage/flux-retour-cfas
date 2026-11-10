import { ObjectId } from "mongodb";
import { SOURCE_APPRENANT } from "shared";
import type { IEffectifQueue } from "shared/models/data/effectifsQueue.model";
import type { IOrganisationCreate } from "shared/models/data/organisations.model";
import type { IOrganisme } from "shared/models/data/organismes.model";
import { beforeEach, describe, expect, it } from "vitest";

import { effectifsQueueDb, organismesDb } from "@/common/model/collections";
import { createRandomOrganisme } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { initTestApp, RequestAsOrganisationFunc, testDoc } from "@tests/utils/testUtils";

const CFA = { uai: "0610071W", siret: "77777777200016" };
const organisation: IOrganisationCreate = { type: "ORGANISME_FORMATION", ...CFA };

describe("Rapport de transmission", () => {
  useMongo();

  let organisme: IOrganisme;
  let requestAsOrganisation: RequestAsOrganisationFunc;
  let httpClient: Awaited<ReturnType<typeof initTestApp>>["httpClient"];

  beforeEach(async () => {
    const app = await initTestApp();
    requestAsOrganisation = app.requestAsOrganisation;
    httpClient = app.httpClient;
    organisme = {
      _id: new ObjectId(),
      ...createRandomOrganisme({ reseaux: [] }),
      ...CFA,
      has_transmission_errors: true,
      transmission_errors_date: new Date("2026-11-04T10:00:00Z"),
    };
    await organismesDb().insertOne(organisme);
  });

  const ligne = (champs: Partial<IEffectifQueue>) =>
    testDoc<IEffectifQueue>({
      source: SOURCE_APPRENANT.FICHIER,
      source_organisme_id: organisme._id.toString(),
      validation_errors: [],
      ...champs,
    });

  it("range les lignes en attente au jour de leur envoi, sans les compter comme transmises", async () => {
    await effectifsQueueDb().insertMany(
      [
        ligne({ created_at: new Date("2026-11-05T09:00:00Z"), processed_at: null, has_error: false }),
        ligne({
          created_at: new Date("2026-11-05T09:00:00Z"),
          processed_at: new Date("2026-11-05T09:05:00Z"),
          has_error: false,
        }),
        ligne({
          created_at: new Date("2026-11-04T09:00:00Z"),
          processed_at: new Date("2026-11-04T09:05:00Z"),
          has_error: true,
        }),
      ],
      { bypassDocumentValidation: true }
    );

    const response = await requestAsOrganisation(
      organisation,
      "get",
      `/api/v1/organismes/${organisme._id}/transmission`
    );

    expect(response.status).toBe(200);
    expect(response.data.data).toEqual([
      { day: "2026-11-05", success: 1, error: 0, pending: 1, total: 2 },
      { day: "2026-11-04", success: 0, error: 1, pending: 0, total: 1 },
    ]);
  });

  it("éteint l'alerte et efface sa date quand le CFA consulte son rapport", async () => {
    const response = await requestAsOrganisation(
      organisation,
      "put",
      `/api/v1/organismes/${organisme._id}/transmission/reset-notification`,
      {}
    );

    expect(response.status).toBe(200);
    const apres = await organismesDb().findOne({ _id: organisme._id });
    expect(apres?.has_transmission_errors).toBe(false);
    expect(apres).not.toHaveProperty("transmission_errors_date");
  });

  it("garde l'alerte du CFA quand un administrateur consulte son rapport en imposture", async () => {
    const imposture = await requestAsOrganisation({ type: "ADMINISTRATEUR" }, "post", "/api/v1/admin/impersonate", {
      type: "ORGANISME_FORMATION",
      ...CFA,
    });
    expect(imposture.status).toBe(200);
    const cookie = imposture.headers["set-cookie"]?.[0];

    const response = await httpClient.put(
      `/api/v1/organismes/${organisme._id}/transmission/reset-notification`,
      {},
      { headers: { cookie } }
    );

    expect(response.status).toBe(200);
    const apres = await organismesDb().findOne({ _id: organisme._id });
    expect(apres?.has_transmission_errors).toBe(true);
    expect(apres?.transmission_errors_date).toEqual(new Date("2026-11-04T10:00:00Z"));
  });
});
