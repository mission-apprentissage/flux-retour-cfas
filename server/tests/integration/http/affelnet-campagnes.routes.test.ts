import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useMongo } from "@tests/jest/setupMongo";
import { initTestApp, RequestAsOrganisationFunc } from "@tests/utils/testUtils";

useMongo();

const DREETS = { type: "DREETS", code_region: "11" } as const;

describe("routes Affelnet et campagnes conservées", () => {
  let requestAsOrganisation: RequestAsOrganisationFunc;

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-19T10:00:00Z"));
    ({ requestAsOrganisation } = await initTestApp());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    "/api/v1/affelnet/national/count",
    "/api/v1/affelnet/export/concretise",
    "/api/v1/affelnet/export/non-concretise",
  ])("%s refuse une campagne purgée", async (route) => {
    const response = await requestAsOrganisation(DREETS, "get", `${route}?year=2024`);

    expect(response.status).toBe(400);
  });

  it("répond pour une campagne conservée", async () => {
    const response = await requestAsOrganisation(DREETS, "get", "/api/v1/affelnet/national/count?year=2025");

    expect(response.status).toBe(200);
    expect(response.data).toStrictEqual({
      voeuxFormules: 0,
      apprenantVoeuxFormules: 0,
      apprenantsNonContretise: 0,
      apprenantsRetrouves: 0,
    });
  });
});
